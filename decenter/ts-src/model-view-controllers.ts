import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js"
import { ManagedEntities } from "./managed-entities.js";
import { GenericEntity } from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";
import { LocalEntityProperty } from "../com.braintribe.gm.owner-model-2.0~/ensure-owner-model.js";
import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js"

export class CreateEntityController<E extends GenericEntity> {
    readonly entityManipulationListener = { onMan: this.onEntityMan.bind(this) };
    readonly managedEntities: ManagedEntities;
    readonly entityType: hc.reflection.EntityType<E>;
    readonly renderer: (entity: E) => void;

    constructor(managedEntities: ManagedEntities, entityType: hc.reflection.EntityType<E>, renderer: (entity: E) => void) {
        this.managedEntities = managedEntities;
        this.entityType = entityType;
        this.renderer = renderer;
        this.managedEntities.session.listeners().add(this.entityManipulationListener);
    }

    private onEntityMan(manipulation: mM.Manipulation) : void {
        let entity: GenericEntity;
        if (mM.ManifestationManipulation.isInstance(manipulation)) {
            entity = (manipulation as mM.LifecycleManipulation).entity;
            
        } else if (mM.InstantiationManipulation.isInstance(manipulation)) {
            const m = manipulation as mM.InstantiationManipulation;

            entity = m.entity;
        }
        
        if (entity == null || !this.entityType.isInstance(entity))
            return;

        this.renderer(entity as E);
    }
}

export class DeleteEntityController {
    readonly managedEntities: ManagedEntities;
    readonly deleteButton: HTMLButtonElement;
    readonly rowElement: HTMLTableRowElement;
    readonly entity: GenericEntity;

    readonly entityManipulationListener = { onMan: this.onEntityMan.bind(this) };

    constructor(managedEntities: ManagedEntities, deleteButton: HTMLButtonElement, rowElement: HTMLTableRowElement, entity: GenericEntity) {
        this.managedEntities = managedEntities;
        this.deleteButton = deleteButton;
        this.rowElement = rowElement;
        this.entity = entity;

        this.deleteButton.onclick = () => this.deleteEntity();
        managedEntities.session.listeners().entity(entity).add(this.entityManipulationListener);
    }

    private onEntityMan(m: mM.Manipulation) {
        if (mM.DeleteManipulation.isInstance(m)) {
            this.rowElement.parentNode.removeChild(this.rowElement);
            this.managedEntities.session.listeners().entity(this.entity).remove(this.entityManipulationListener);
        }
    }

    private deleteEntity() {
        this.managedEntities.delete(this.entity);
    }
}

export enum CellValueType {
    string,
    number,
    date
}

export class ValueEditingController {
    readonly managedEntities: ManagedEntities;
    readonly editButton: HTMLButtonElement
    readonly entity: GenericEntity;
    readonly cellValueType: CellValueType
    readonly propertyName: string
    inputField: HTMLInputElement
    skipTracking: boolean
    keyListener = this.onKey.bind(this)

    readonly propertyManipulationListener = { onMan: this.onPropertyMan.bind(this) };
    readonly entityManipulationListener = { onMan: this.onEntityMan.bind(this) };

    constructor(managedEntities: ManagedEntities, editButton: HTMLButtonElement, entity: GenericEntity, cellValueType: CellValueType, propertyName: string) {
        this.managedEntities = managedEntities;
        this.editButton = editButton
        this.entity = entity
        this.cellValueType = cellValueType
        this.propertyName = propertyName
        this.skipTracking = false
        this.editButton.onclick = () => this.editValue();

         // Add manipulation listener
        managedEntities.session.listeners().entityProperty(entity, propertyName).add(this.propertyManipulationListener);
        managedEntities.session.listeners().entity(entity).add(this.entityManipulationListener);

        this.createValueInputField();
        this.setInputFieldValue();
    }

    private onKey(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.saveValue();
          }
    }

    private onEntityMan(m: mM.Manipulation) {
        if (mM.DeleteManipulation.isInstance(m)) {
            this.managedEntities.session.listeners().entityProperty(this.entity, this.propertyName).remove(this.propertyManipulationListener);
            this.managedEntities.session.listeners().entity(this.entity).remove(this.entityManipulationListener);
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
        try {
            switch (this.cellValueType) {
                case CellValueType.string:
                    (this.entity as any)[this.propertyName] = this.inputField.value;
                    break;
                case CellValueType.number:
                    (this.entity as any)[this.propertyName] = this.inputField.valueAsNumber;
                    break;
                case CellValueType.date:
                    (this.entity as any)[this.propertyName] = this.inputField.valueAsDate;
                    break;
                }
        } finally {
            this.skipTracking = false;
        }
        
        this.inputField.readOnly = true
        this.inputField.removeEventListener("keypress", this.keyListener)
        this.editButton.textContent = '\u270e'
        this.editButton.onclick = () => this.editValue()
    }

    onPropertyMan(manipulation: mM.Manipulation): void {
        if (this.skipTracking) 
            return;

        this.setInputFieldValue();
    }

    setInputFieldValue() : void {
        const value = (this.entity as any)[this.propertyName];
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
                const date = value as hc.lang.Date
                const time = (date)?.getTime()
                this.inputField.valueAsDate = time? new Date(time as any) : null;
                break;
        }
    }

    createValueInputField() : void {
        let inputField = document.createElement("input") as HTMLInputElement;

        const idPostfix = `${this.propertyName}-${this.entity.globalId}`
        inputField.id = 'input-value-' + idPostfix;
        inputField.classList.add('form-control');
        inputField.classList.add('input-value');
        inputField.readOnly = true;
        
        this.inputField = inputField;
    }
}
