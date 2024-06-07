import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
export class CreateEntityController {
    constructor(managedEntities, entityType, renderer) {
        this.entityManipulationListener = { onMan: this.onEntityMan.bind(this) };
        this.managedEntities = managedEntities;
        this.entityType = entityType;
        this.renderer = renderer;
        this.managedEntities.session.listeners().add(this.entityManipulationListener);
    }
    onEntityMan(manipulation) {
        if (!(mM.InstantiationManipulation.isInstance(manipulation) || mM.ManifestationManipulation.isInstance(manipulation)))
            return;
        const entity = manipulation.entity;
        if (!this.entityType.isInstance(entity))
            return;
        this.renderer(entity);
    }
}
export class DeleteEntityController {
    constructor(managedEntities, deleteButton, rowElement, entity) {
        this.entityManipulationListener = { onMan: this.onEntityMan.bind(this) };
        this.managedEntities = managedEntities;
        this.deleteButton = deleteButton;
        this.rowElement = rowElement;
        this.entity = entity;
        this.deleteButton.onclick = () => this.deleteEntity();
        managedEntities.session.listeners().entity(entity).add(this.entityManipulationListener);
    }
    onEntityMan(m) {
        if (mM.DeleteManipulation.isInstance(m)) {
            this.rowElement.parentNode.removeChild(this.rowElement);
            this.managedEntities.session.listeners().entity(this.entity).remove(this.entityManipulationListener);
        }
    }
    deleteEntity() {
        this.managedEntities.session.deleteEntity(this.entity);
    }
}
export var CellValueType;
(function (CellValueType) {
    CellValueType[CellValueType["string"] = 0] = "string";
    CellValueType[CellValueType["number"] = 1] = "number";
    CellValueType[CellValueType["date"] = 2] = "date";
})(CellValueType || (CellValueType = {}));
export class ValueEditingController {
    constructor(managedEntities, editButton, entity, cellValueType, propertyName) {
        this.keyListener = this.onKey.bind(this);
        this.propertyManipulationListener = { onMan: this.onPropertyMan.bind(this) };
        this.entityManipulationListener = { onMan: this.onEntityMan.bind(this) };
        this.managedEntities = managedEntities;
        this.editButton = editButton;
        this.entity = entity;
        this.cellValueType = cellValueType;
        this.propertyName = propertyName;
        this.skipTracking = false;
        this.editButton.onclick = () => this.editValue();
        // Add manipulation listener
        managedEntities.session.listeners().entityProperty(entity, propertyName).add(this.propertyManipulationListener);
        managedEntities.session.listeners().entity(entity).add(this.entityManipulationListener);
        this.createValueInputField();
        this.setInputFieldValue();
    }
    onKey(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.saveValue();
        }
    }
    onEntityMan(m) {
        if (mM.DeleteManipulation.isInstance(m)) {
            this.managedEntities.session.listeners().entityProperty(this.entity, this.propertyName).remove(this.propertyManipulationListener);
            this.managedEntities.session.listeners().entity(this.entity).remove(this.entityManipulationListener);
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
                    this.entity[this.propertyName] = this.inputField.value;
                    break;
                case CellValueType.number:
                    this.entity[this.propertyName] = this.inputField.valueAsNumber;
                    break;
                case CellValueType.date:
                    this.entity[this.propertyName] = hc.time.fromJsDate(this.inputField.valueAsDate);
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
    onPropertyMan(manipulation) {
        if (this.skipTracking)
            return;
        this.setInputFieldValue();
    }
    setInputFieldValue() {
        const value = this.entity[this.propertyName];
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
                const time = (date)?.getTime();
                this.inputField.valueAsDate = time ? new Date(time) : null;
                break;
        }
    }
    createValueInputField() {
        let inputField = document.createElement("input");
        const idPostfix = `${this.propertyName}-${this.entity.globalId}`;
        inputField.id = 'input-value-' + idPostfix;
        inputField.classList.add('form-control');
        inputField.classList.add('input-value');
        inputField.readOnly = true;
        this.inputField = inputField;
    }
}
