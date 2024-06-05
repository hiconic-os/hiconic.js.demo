import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import { openEntities } from "./managed-entities.js";
import * as m from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js";
/* ------------- ELEMENTS ------------- */
const personTable = document.getElementById("tbody-persons");
const buttonAddPerson = document.getElementById("button-add-person");
const buttonSave = document.getElementById("button-save");
const addPersonForm = document.getElementById("form-add-person");
const divAlert = document.getElementById("div-alert");
/* ------------- STATIC EVENT LISTENERS ------------- */
buttonAddPerson.addEventListener("click", addPerson);
buttonSave.addEventListener("click", save);
const managedEntities = openEntities("person-index");
managedEntities.addManipulationListener(m => buttonSave.style.visibility = "visible");
/* ------------- FUNCTIONS ------------- */
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
    let inputField = createValueInputField(idPostfix, cellValueType, person[propertyName]);
    document.getElementById(valueTdId)?.appendChild(inputField);
    const editButton = document.getElementById(buttonId);
    new ValueEditingController(editButton, inputField, person, cellValueType, propertyName);
}
class ValueEditingController {
    constructor(editButton, inputField, person, cellValueType, propertyName) {
        this.keyListener = this.onKey.bind(this);
        this.editButton = editButton;
        this.inputField = inputField;
        this.person = person;
        this.cellValueType = cellValueType;
        this.propertyName = propertyName;
        this.editButton.onclick = () => this.editValue();
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
        this.inputField.readOnly = true;
        this.inputField.removeEventListener("keypress", this.keyListener);
        this.editButton.textContent = '\u270e';
        this.editButton.onclick = () => this.editValue();
    }
}
function createValueInputField(idPostfix, cellValueType, value) {
    let inputField = document.createElement("input");
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
            const date = value;
            const time = (date).getTime();
            inputField.valueAsDate = new Date(time);
            break;
    }
    return inputField;
}
async function save() {
    const manCount = managedEntities.manipulations.length;
    await managedEntities.commit();
    buttonSave.style.visibility = "hidden";
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
