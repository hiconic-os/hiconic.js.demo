import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import { openEntities } from "./managed-entities.js";
import * as m from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js";
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
    /*buttonSave.style.visibility = b.headCount() > 0 ? "visible" : "hidden";
    buttonUndo.style.visibility = b.canUndo() > 0 ? "visible" : "hidden";
    buttonRedo.style.visibility = b.canRedo() > 0 ? "visible" : "hidden";*/
    buttonSave.disabled = b.headCount() > 0 ? false : true;
    buttonUndo.disabled = b.canUndo() > 0 ? false : true;
    buttonRedo.disabled = b.canRedo() > 0 ? false : true;
}
async function main() {
    await managedEntities.load();
    renderTable();
}
main();
function addPerson() {
    const name = getValueFromInputElement("input-name", true);
    const lastName = getValueFromInputElement("input-last-name", true);
    const birthday = new Date(getValueFromInputElement("input-birthday", true));
    const email = getValueFromInputElement("input-email", false);
    const person = managedEntities.create(m.Person);
    person.name = name;
    person.lastName = lastName;
    person.birthday = hc.time.fromJsDate(birthday);
    person.email = email;
    renderTable();
    addPersonForm.reset();
}
function getValueFromInputElement(id, mandatory) {
    const element = document.getElementById(id);
    const value = element.value;
    if (value)
        return value;
    if (mandatory)
        showAlert("Input for " + element.name + " is mandatory.");
    return "";
}
async function renderTable() {
    personTable.innerHTML = '';
    const results = (await managedEntities.session.query().entitiesString("from " + m.Person.getTypeSignature())).list();
    const count = results.size();
    for (let i = 0; i < count; i++) {
        const p = results.getAtIndex(i);
        const tr = document.createElement('tr');
        personTable.appendChild(tr);
        appendTableCell(tr, p, CellValueType.string, "name");
        appendTableCell(tr, p, CellValueType.string, "lastName");
        appendTableCell(tr, p, CellValueType.date, "birthday");
        appendTableCell(tr, p, CellValueType.string, "email");
        const cell = document.createElement('td');
        tr.appendChild(cell);
        const delButtonId = 'button-delete-' + p.globalId;
        cell.innerHTML = `<button id ="${delButtonId}" class ="btn btn-light">\u2715</button>`;
        const deleteButton = document.getElementById(delButtonId);
        deleteButton.onclick = () => deletePerson(p);
    }
}
var CellValueType;
(function (CellValueType) {
    CellValueType[CellValueType["string"] = 0] = "string";
    CellValueType[CellValueType["number"] = 1] = "number";
    CellValueType[CellValueType["date"] = 2] = "date";
})(CellValueType || (CellValueType = {}));
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
    const controller = new ValueEditingController(editButton, person, cellValueType, propertyName);
    document.getElementById(valueTdId)?.appendChild(controller.inputField);
}
class ValueEditingController {
    constructor(editButton, person, cellValueType, propertyName) {
        this.keyListener = this.onKey.bind(this);
        this.editButton = editButton;
        this.person = person;
        this.cellValueType = cellValueType;
        this.propertyName = propertyName;
        this.skipTracking = false;
        this.editButton.onclick = () => this.editValue();
        // Add manipulation listener
        managedEntities.session.listeners().entityProperty(person, propertyName).add(this);
        this.createValueInputField();
        this.setInputFieldValue();
    }
    onKey(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.saveValue();
        }
    }
    editValue() {
        this.inputField.focus();
        this.inputField.addEventListener("keypress", this.keyListener);
        this.inputField.readOnly = false;
        this.editButton.textContent = '\u2713';
        this.editButton.onclick = () => this.saveValue();
    }
    saveValue() {
        this.skipTracking = true;
        try {
            switch (this.cellValueType) {
                case CellValueType.string:
                    this.person[this.propertyName] = this.inputField.value;
                    break;
                case CellValueType.number:
                    this.person[this.propertyName] = this.inputField.valueAsNumber;
                    break;
                case CellValueType.date:
                    this.person[this.propertyName] = hc.time.fromJsDate(this.inputField.valueAsDate);
                    break;
            }
        }
        finally {
            this.skipTracking = false;
        }
        this.inputField.readOnly = true;
        this.inputField.removeEventListener("keypress", this.keyListener);
        this.editButton.textContent = '\u270e';
        this.editButton.onclick = () => this.editValue();
    }
    onMan(manipulation) {
        if (this.skipTracking)
            return;
        this.setInputFieldValue();
    }
    setInputFieldValue() {
        const value = this.person[this.propertyName];
        switch (this.cellValueType) {
            case CellValueType.string:
                this.inputField.type = 'text';
                this.inputField.value = value;
                break;
            case CellValueType.number:
                this.inputField.type = 'number';
                this.inputField.valueAsNumber = value;
                break;
            case CellValueType.date:
                this.inputField.type = 'date';
                const date = value;
                const time = (date).getTime();
                this.inputField.valueAsDate = new Date(time);
                break;
        }
    }
    createValueInputField() {
        let inputField = document.createElement("input");
        const idPostfix = `${this.propertyName}-${this.person.globalId}`;
        inputField.id = 'input-value-' + idPostfix;
        inputField.classList.add('form-control');
        inputField.classList.add('input-value');
        inputField.readOnly = true;
        this.inputField = inputField;
    }
}
async function save() {
    const manCount = managedEntities.manipulationBuffer.headCount();
    await managedEntities.commit();
    showAlert('Successfully saved transaction with ' + manCount + ' change(s).');
}
function deletePerson(person) {
    managedEntities.session.deleteEntity(person);
    renderTable();
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
