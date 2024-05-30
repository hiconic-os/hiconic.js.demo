import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js"
import { ManagedEntities, openEntities } from "./managed-entities.js"
import * as m from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js"

/* ------------- ELEMENTS ------------- */
const personTable = document.getElementById("tbody-persons") as HTMLTableElement;

const buttonAddPerson = document.getElementById("button-add-person") as HTMLButtonElement;
const buttonSave = document.getElementById("button-save") as HTMLButtonElement;
const addPersonForm = document.getElementById("form-add-person") as HTMLFormElement;

/* ------------- EVENT LISTENERS ------------- */
buttonAddPerson.addEventListener("click", addPerson);
buttonSave.addEventListener("click", save);

const managedEntities = openEntities("person-index")
managedEntities.addManipulationListener(m => buttonSave.style.visibility = "visible")

/* ------------- FUNCTIONS ------------- */
async function save() : Promise<void> {
    await managedEntities.commit()

    buttonSave.style.visibility = "hidden"
}

async function main(): Promise<void> {
    await managedEntities.load()
    renderTable()
}

main()

function reset(): void {
    personTable.innerHTML='';
}

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
        console.log("Input '" + element.name + "' is mandatory!")

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
    
    /*
    cell.innerHTML = 
    `<table width='100%'>
    <tr>
    <td id='${valueTdId}'></td>
    <td><button id='${buttonId}' class='btn btn-outline-secondary'>Edit</button></td>
    </tr>
    </table>`;
     */
    cell.innerHTML = 
    `<div class='div-value-action'>
    <div class='div-value' id='${valueTdId}'></div>
    <div class='div-action'><button id='${buttonId}' class='btn btn-outline-secondary button-edit'>\u270e</button></div>
    </div>`;

    tr.appendChild(cell);

    let inputField = createValueInputField(idPostfix, cellValueType, (person as any)[propertyName])
    document.getElementById(valueTdId)?.appendChild(inputField)
    
    const editButton = document.getElementById(buttonId) as HTMLButtonElement
    new ValueEditingController(editButton, inputField, person, cellValueType, propertyName)
    
}

class ValueEditingController {
    readonly editButton: HTMLButtonElement
    readonly inputField: HTMLInputElement
    readonly person: m.Person
    readonly cellValueType: CellValueType
    readonly propertyName: string
    keyListener = this.onKey.bind(this)

    constructor(editButton: HTMLButtonElement, inputField: HTMLInputElement, person: m.Person, cellValueType: CellValueType, propertyName: string) {
        this.editButton = editButton
        this.inputField = inputField
        this.person = person
        this.cellValueType = cellValueType
        this.propertyName = propertyName
        this.editButton.onclick = () => this.editValue()
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
        switch (this.cellValueType) {
            case CellValueType.string:
                (this.person as any)[this.propertyName] = this.inputField.value
                break;
                case CellValueType.number:
                (this.person as any)[this.propertyName] = this.inputField.valueAsNumber
                break;
                case CellValueType.date:
                (this.person as any)[this.propertyName] = hc.time.fromJsDate(this.inputField.valueAsDate as any)
                break;
        }
        
        this.inputField.readOnly = true
        this.inputField.removeEventListener("keypress", this.keyListener)
        this.editButton.textContent = '\u270e'
        this.editButton.onclick = () => this.editValue()
    }

}

function createValueInputField(idPostfix: string, cellValueType: CellValueType, value: any) : HTMLInputElement {
    let inputField = document.createElement("input") as HTMLInputElement;
    inputField.id = 'input-value-' + idPostfix;
    inputField.classList.add('form-control');
    inputField.classList.add('input-value');
    inputField.readOnly = true;

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

