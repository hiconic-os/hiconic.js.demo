import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import { ManagedEntities } from "./managed-entities.js";
import { GenericEntity } from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";
import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
export declare class CreateEntityController<E extends GenericEntity> {
    readonly entityManipulationListener: {
        onMan: any;
    };
    readonly managedEntities: ManagedEntities;
    readonly entityType: hc.reflection.EntityType<E>;
    readonly renderer: (entity: E) => void;
    constructor(managedEntities: ManagedEntities, entityType: hc.reflection.EntityType<E>, renderer: (entity: E) => void);
    private onEntityMan;
}
export declare class DeleteEntityController {
    readonly managedEntities: ManagedEntities;
    readonly deleteButton: HTMLButtonElement;
    readonly rowElement: HTMLTableRowElement;
    readonly entity: GenericEntity;
    readonly entityManipulationListener: {
        onMan: any;
    };
    constructor(managedEntities: ManagedEntities, deleteButton: HTMLButtonElement, rowElement: HTMLTableRowElement, entity: GenericEntity);
    private onEntityMan;
    private deleteEntity;
}
export declare enum CellValueType {
    string = 0,
    number = 1,
    date = 2
}
export declare class ValueEditingController {
    readonly managedEntities: ManagedEntities;
    readonly editButton: HTMLButtonElement;
    readonly entity: GenericEntity;
    readonly cellValueType: CellValueType;
    readonly propertyName: string;
    inputField: HTMLInputElement;
    skipTracking: boolean;
    keyListener: any;
    readonly propertyManipulationListener: {
        onMan: any;
    };
    readonly entityManipulationListener: {
        onMan: any;
    };
    constructor(managedEntities: ManagedEntities, editButton: HTMLButtonElement, entity: GenericEntity, cellValueType: CellValueType, propertyName: string);
    private onKey;
    private onEntityMan;
    editValue(): void;
    saveValue(): void;
    onPropertyMan(manipulation: mM.Manipulation): void;
    setInputFieldValue(): void;
    createValueInputField(): void;
}
