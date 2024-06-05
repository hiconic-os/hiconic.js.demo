import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js"
import { ManagedEntities, ManipulationListener, openEntities } from "./managed-entities.js"
import * as m from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js"
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js"

/* ------------- ELEMENTS ------------- */
const personTable = document.getElementById("tbody-persons") as HTMLTableElement;

const addPersonForm = document.getElementById("form-add-person") as HTMLFormElement;
const divAlert = document.getElementById("div-alert") as HTMLDivElement;
const buttonAddPerson = document.getElementById("button-add-person") as HTMLButtonElement;
const buttonSave = document.getElementById("button-save") as HTMLButtonElement;
const buttonUndo = document.getElementById("button-undo") as HTMLButtonElement;
const buttonRedo = document.getElementById("button-redo") as HTMLButtonElement;

/* ------------- STATIC EVENT LISTENERS ------------- */
buttonAddPerson.addEventListener("click", addPerson);
buttonSave.addEventListener("click", save);
buttonUndo.addEventListener("click", undo);
buttonRedo.addEventListener("click", redo);

const managedEntities = openEntities("person-index")
managedEntities.manipulationBuffer.addBufferUpdateListener((b) => buttonSave.style.visibility = b.headCount() > 0? "visible": "hidden");

/* ------------- FUNCTIONS ------------- */
async function main(): Promise<void> {
    await managedEntities.load()
    renderTable()
}

main()

function addPerson(): void {
    const name = getValueFromInputElement("input-name", true);
    const lastName = getValueFromInputElement("input-last-name", true);
    const birthday = new Date(getValueFromInputElement("input-birthday", true));
    const email = getValueFromInputElement("input-email", false);

    const person = managedEntities.create(m.Person);
    person.name = name
    person.lastName = lastName
    person.birthday = hc.time.fromJsDate(birthday as any)
    person.email = email
    
    renderTable();
    
    addPersonForm.reset();
}

function getValueFromInputElement(id:string, mandatory:boolean) : string {
    const element = document.getElementById(id) as HTMLInputElement

    const value = element.value
    if (value)
        return value;
    
    if (mandatory)
        showAlert("Input for " + element.name + " is mandatory.")

    return "";
}

async function renderTable() : Promise<void> {
    personTable.innerHTML='';
    
    const results: hc.lang.List<m.Person> = (await managedEntities.session.query().entitiesString("from " + m.Person.getTypeSignature())).list()

    const count = results.size()

    for (let i = 0; i < count; i++) {
        const p = results.getAtIndex(i)

        const tr = document.createElement('tr');
        personTable.appendChild(tr);
        
        appendTableCell(tr, p, CellValueType.string, "name")
        appendTableCell(tr, p, CellValueType.string, "lastName")
        appendTableCell(tr, p, CellValueType.date, "birthday")
        appendTableCell(tr, p, CellValueType.string, "email")

        const cell = document.createElement('td');
        tr.appendChild(cell);

        const delButtonId = 'button-delete-' + p.globalId
        cell.innerHTML = `<button id ="${delButtonId}" class ="btn btn-light">\u2715</button>`

        const deleteButton = document.getElementById(delButtonId) as HTMLButtonElement
        deleteButton.onclick = () => deletePerson(p)

    }
}

enum CellValueType {
    string,
    number,
    date
}

function appendTableCell(tr: HTMLTableRowElement, person: m.Person, cellValueType: CellValueType, propertyName: string) : void {
    const globalId = person.globalId
    const idPostfix = `${propertyName}-${globalId}`
    const cell = document.createElement('td');

    var buttonId = 'button-edit-' + idPostfix
    var valueTdId = 'td-value-' + idPostfix
    
    cell.innerHTML = 
    `<div class='div-value-action'>
    <div class='div-action'><button id='${buttonId}' class='btn btn-outline-secondary button-edit'>\u270e</button></div>
    <div class='div-value' id='${valueTdId}'></div>
    </div>`;

    tr.appendChild(cell);

    let inputField = createValueInputField(idPostfix, cellValueType, person, propertyName)
    document.getElementById(valueTdId)?.appendChild(inputField)
    
    const editButton = document.getElementById(buttonId) as HTMLButtonElement
    new ValueEditingController(editButton, inputField, person, cellValueType, propertyName)
    
}

class ValueEditingController implements hc.manipulation.ManipulationListener {
    readonly editButton: HTMLButtonElement
    readonly inputField: HTMLInputElement
    readonly person: m.Person
    readonly cellValueType: CellValueType
    readonly propertyName: string
    skipTracking: boolean
    keyListener = this.onKey.bind(this)

    constructor(editButton: HTMLButtonElement, inputField: HTMLInputElement, person: m.Person, cellValueType: CellValueType, propertyName: string) {
        this.editButton = editButton
        this.inputField = inputField
        this.person = person
        this.cellValueType = cellValueType
        this.propertyName = propertyName
        this.skipTracking = false
        this.editButton.onclick = () => this.editValue();

         // Add manipulation listener
        managedEntities.session.listeners().entityProperty(person, propertyName).add(this);
    }

    private onKey(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.saveValue();
          }
    }

    editValue() : void {
        this.inputField.focus()
        this.inputField.addEventListener("keypress", this.keyListener)
        this.inputField.readOnly = false
        this.editButton.textContent = '\u2713'
        this.editButton.onclick = () => this.saveValue()
    }

    saveValue() : void {
        this.skipTracking = true;
try{
        switch (this.cellValueType) {
            case CellValueType.string:
                (this.person as any)[this.propertyName] = this.inputField.value;
                break;
            case CellValueType.number:
                (this.person as any)[this.propertyName] = this.inputField.valueAsNumber;
                break;
            case CellValueType.date:
                (this.person as any)[this.propertyName] = hc.time.fromJsDate(this.inputField.valueAsDate as any);
                break;
            }
        }finally{ this.skipTracking = false;}
        
        this.inputField.readOnly = true
        this.inputField.removeEventListener("keypress", this.keyListener)
        this.editButton.textContent = '\u270e'
        this.editButton.onclick = () => this.editValue()
    }

    onMan(manipulation: mM.Manipulation): void {
        const newValue = (manipulation as mM.ChangeValueManipulation).newValue;
        
        const buttonUndo = document.getElementById("button-undo") as HTMLButtonElement
        buttonUndo.style.visibility = 'visible'
    }

}

function createValueInputField(idPostfix: string, cellValueType: CellValueType, person: m.Person, propertyName: string) : HTMLInputElement {
    let inputField = document.createElement("input") as HTMLInputElement;
    inputField.id = 'input-value-' + idPostfix;
    inputField.classList.add('form-control');
    inputField.classList.add('input-value');
    inputField.readOnly = true;
    
    const value = (person as any)[propertyName];
    switch (cellValueType) {
        case CellValueType.string:
            inputField.type = 'text';
            inputField.value = value;
            break;
        case CellValueType.number:
            inputField.type = 'number';
            inputField.valueAsNumber = value;
            break;
        case CellValueType.date:
            inputField.type = 'date';
            const date = value as hc.lang.Date
            const time = (date).getTime()
            inputField.valueAsDate = new Date(time as any);
            break;
    }

    return inputField;
}

async function save() : Promise<void> {
    const manCount = managedEntities.manipulationBuffer.headCount();
    await managedEntities.commit();

    showAlert('Successfully saved transaction with ' + manCount + ' change(s).')
}

function deletePerson(person: m.Person) : void {
    managedEntities.session.deleteEntity(person);
    renderTable()
}

function showAlert(textContent: string) : void {
    divAlert.classList.add("show");
    divAlert.textContent = textContent
    setTimeout(function() {
        divAlert.classList.remove("show");
        }, 3000);
}

function undo() : void {
    managedEntities.manipulations[manipulations.length-1].in
}

function redo() : void {

}

