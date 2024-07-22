import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js"
import { ManipulationBuffer, ManagedEntities, openEntities } from "./managed-entities.js"
import * as m from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js"
import { CreateEntityController, DeleteEntityController, ValueEditingController, CellValueType } from "./model-view-controllers.js";

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
globalThis.managedEnties = managedEntities;
managedEntities.manipulationBuffer.addBufferUpdateListener(updateOnManBufferChange);

/* ------------- FUNCTIONS ------------- */
function updateOnManBufferChange(b: ManipulationBuffer) {
    buttonSave.disabled = b.headCount() > 0 ? false : true;
    buttonUndo.disabled = b.canUndo() ? false : true;
    buttonRedo.disabled = b.canRedo() ? false : true;
}

async function main(): Promise<void> {
    try {
        await managedEntities.load()
    } catch (e) {
        console.log(e);
    }
    renderTable()

    new CreateEntityController<m.Person>(managedEntities, m.Person, createTableRowForPerson);
}

main()

async function renderTable() : Promise<void> {
    personTable.innerHTML='';
    
    const results: hc.lang.List<m.Person> = (await managedEntities.session.query().entitiesString("from " + m.Person.getTypeSignature())).list()
    const count = results.size();

    for (let i = 0; i < count; i++) {
        createTableRowForPerson(results.getAtIndex(i));
    }
}

function addPerson(): void {
    const name: string = getValueFromInputElement("input-name", true);
    const lastName: string = getValueFromInputElement("input-last-name", true);
    const birthday: Date = getValueFromInputElement("input-birthday", true);
    const email: string = getValueFromInputElement("input-email", false);

    managedEntities.compoundManipulation(() => {
        const person = managedEntities.create(m.Person);
        person.name = name;
        person.lastName = lastName;
        person.birthday = birthday;
        person.email = email;
    })
    
    addPersonForm.reset();
}

function getValueFromInputElement<V extends string|number|date>(id:string, mandatory:boolean) : V {
    const element = document.getElementById(id) as HTMLInputElement

    let value: string | number | date;

    switch (element.type) {
        case "text":
            value = element.value;
            break;
        case "number":
            value = element.valueAsNumber;
            break;
        case "date":
            value = element.valueAsDate;
            break;
    }

    if (value)
        return value as V;
    
    if (mandatory)
        showAlert("Input for " + element.name + " is mandatory.")

    return null;
}

function createTableRowForPerson(p: m.Person) : void {
    const tr = document.createElement('tr');
    personTable.appendChild(tr);
    
    appendTableCell(tr, p, CellValueType.string, "name")
    appendTableCell(tr, p, CellValueType.string, "lastName")
    appendTableCell(tr, p, CellValueType.date, "birthday")
    appendTableCell(tr, p, CellValueType.string, "email")

    // Button
    const cell = document.createElement('td');
    tr.appendChild(cell);

    const delButtonId = 'button-delete-' + p.globalId
    cell.innerHTML = `<button id ="${delButtonId}" class ="btn btn-light">\u2715</button>`

    const deleteButton = document.getElementById(delButtonId) as HTMLButtonElement;
    
    new DeleteEntityController(managedEntities, deleteButton, tr, p);
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

    const editButton = document.getElementById(buttonId) as HTMLButtonElement

    const controller = new ValueEditingController(managedEntities, editButton, person, cellValueType, propertyName)
    document.getElementById(valueTdId)?.appendChild(controller.inputField)
    
}

async function save() : Promise<void> {
    const manCount = managedEntities.manipulationBuffer.headCount();
    await managedEntities.commit();

    showAlert('Successfully saved transaction with ' + manCount + ' change(s).')
}

function showAlert(textContent: string) : void {
    divAlert.classList.add("show");
    divAlert.textContent = textContent
    setTimeout(function() {
        divAlert.classList.remove("show");
        }, 3000);
}

function undo() : void {
    managedEntities.manipulationBuffer.undo();
}

function redo() : void {
    managedEntities.manipulationBuffer.redo();
}

