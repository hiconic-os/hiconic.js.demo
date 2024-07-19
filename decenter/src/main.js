import { openEntities } from "./managed-entities.js";
import * as m from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js";
import { CreateEntityController, DeleteEntityController, ValueEditingController, CellValueType } from "./model-view-controllers.js";
/* ------------- ELEMENTS ------------- */
const personTable = document.getElementById("tbody-persons");
const addPersonForm = document.getElementById("form-add-person");
const divAlert = document.getElementById("div-alert");
const buttonAddPerson = document.getElementById("button-add-person");
const buttonSave = document.getElementById("button-save");
const buttonUndo = document.getElementById("button-undo");
const buttonRedo = document.getElementById("button-redo");
/* ------------- STATIC EVENT LISTENERS ------------- */
buttonAddPerson.addEventListener("click", addPerson);
buttonSave.addEventListener("click", save);
buttonUndo.addEventListener("click", undo);
buttonRedo.addEventListener("click", redo);
const managedEntities = openEntities("person-index");
globalThis.managedEnties = managedEntities;
managedEntities.manipulationBuffer.addBufferUpdateListener(updateOnManBufferChange);
/* ------------- FUNCTIONS ------------- */
function updateOnManBufferChange(b) {
    buttonSave.disabled = b.headCount() > 0 ? false : true;
    buttonUndo.disabled = b.canUndo() ? false : true;
    buttonRedo.disabled = b.canRedo() ? false : true;
}
async function main() {
    await managedEntities.load();
    renderTable();
    new CreateEntityController(managedEntities, m.Person, createTableRowForPerson);
}
main();
async function renderTable() {
    personTable.innerHTML = '';
    const results = (await managedEntities.session.query().entitiesString("from " + m.Person.getTypeSignature())).list();
    const count = results.size();
    for (let i = 0; i < count; i++) {
        createTableRowForPerson(results.getAtIndex(i));
    }
}
function addPerson() {
    const name = getValueFromInputElement("input-name", true);
    const lastName = getValueFromInputElement("input-last-name", true);
    const birthday = getValueFromInputElement("input-birthday", true);
    const email = getValueFromInputElement("input-email", false);
    managedEntities.compoundManipulation(() => {
        const person = managedEntities.create(m.Person);
        person.name = name;
        person.lastName = lastName;
        person.birthday = birthday;
        person.email = email;
    });
    addPersonForm.reset();
}
function getValueFromInputElement(id, mandatory) {
    const element = document.getElementById(id);
    let value;
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
        return value;
    if (mandatory)
        showAlert("Input for " + element.name + " is mandatory.");
    return null;
}
function createTableRowForPerson(p) {
    const tr = document.createElement('tr');
    personTable.appendChild(tr);
    appendTableCell(tr, p, CellValueType.string, "name");
    appendTableCell(tr, p, CellValueType.string, "lastName");
    appendTableCell(tr, p, CellValueType.date, "birthday");
    appendTableCell(tr, p, CellValueType.string, "email");
    // Button
    const cell = document.createElement('td');
    tr.appendChild(cell);
    const delButtonId = 'button-delete-' + p.globalId;
    cell.innerHTML = `<button id ="${delButtonId}" class ="btn btn-light">\u2715</button>`;
    const deleteButton = document.getElementById(delButtonId);
    new DeleteEntityController(managedEntities, deleteButton, tr, p);
}
function appendTableCell(tr, person, cellValueType, propertyName) {
    const globalId = person.globalId;
    const idPostfix = `${propertyName}-${globalId}`;
    const cell = document.createElement('td');
    var buttonId = 'button-edit-' + idPostfix;
    var valueTdId = 'td-value-' + idPostfix;
    cell.innerHTML =
        `<div class='div-value-action'>
    <div class='div-action'><button id='${buttonId}' class='btn btn-outline-secondary button-edit'>\u270e</button></div>
    <div class='div-value' id='${valueTdId}'></div>
    </div>`;
    tr.appendChild(cell);
    const editButton = document.getElementById(buttonId);
    const controller = new ValueEditingController(managedEntities, editButton, person, cellValueType, propertyName);
    document.getElementById(valueTdId)?.appendChild(controller.inputField);
}
async function save() {
    const manCount = managedEntities.manipulationBuffer.headCount();
    await managedEntities.commit();
    showAlert('Successfully saved transaction with ' + manCount + ' change(s).');
}
function showAlert(textContent) {
    divAlert.classList.add("show");
    divAlert.textContent = textContent;
    setTimeout(function () {
        divAlert.classList.remove("show");
    }, 3000);
}
function undo() {
    managedEntities.manipulationBuffer.undo();
}
function redo() {
    managedEntities.manipulationBuffer.redo();
}
