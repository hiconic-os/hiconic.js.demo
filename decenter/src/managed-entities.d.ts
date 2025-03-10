/// <reference path="../sources/tribefire.js.gwt-basic-managed-gm-session-3.0~/gwt-basic-managed-gm-session.d.ts" />
/// <reference path="../sources/tribefire.js.tribefire-js-module-3.0~/tribefire-js-module.d.ts" />
import { session, reflection } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as rM from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";
import { ManipulationBuffer, ManipulationBufferUpdateListener } from "./manipulation-buffer.js";
export { ManipulationBuffer, ManipulationBufferUpdateListener };
/**
 * Opens a {@link ManagedEntities} instance backed by the indexedDB named "event-source-db".
 * @param databaseName name of the ObjectStore used as space for the stored events
 */
export declare function openEntities(databaseName: string): ManagedEntities;
export type PartialProperties<T> = Partial<Pick<T, {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T]>>;
/**
 * Manages entities given by instances {@link rM.GenericEntity GenericEntity} within an in-memory OODB and
 * stores changes in a event-sourcing persistence (e.g. indexedDB, Supabase, SQL blobs).
 *
 * The initial state of all entities is built from the change history loaded from the event-source persistence. Once the state is established
 * changes on entities are recorded as instances of {@link mM.Manipulation Manipulation}.
 *
 * Changes can be committed which is done by the appendage of a new transaction entry containing the recorded {@link mM.Manipulation manipulations}
 * in a serialized form.
 */
export interface ManagedEntities {
    /**
     * An buffer of manipulations that will collect {@link mM.Manipulation manipulations} recorded by the {@link ManagedEntitiesImpl.session session}
     * for later committing
     */
    manipulationBuffer: ManipulationBuffer;
    /**
     * Creates a {@link ManagedEntities.session|session}-associated {@link rM.GenericEntity entity} with a globalId initialized to a random UUID.
     * The default initializers of the entity will be applied.
     * The instantiation will be recorded as {@link mM.InstantiationManipulation InstantiationManipulation}
     * @param type the {@link reflection.EntityType entity type} of the entity to be created
     */
    create<E extends rM.GenericEntity>(type: reflection.EntityType<E>, properties?: PartialProperties<E>): E;
    /**
     * Creates a {@link ManagedEntities.session|session}-associated {@link rM.GenericEntity entity} with a globalId initialized to a random UUID.
     * The default initializers of the entity will not be applied.
     * The instantiation will be recorded as {@link mM.InstantiationManipulation InstantiationManipulation}
     * @param type the {@link reflection.EntityType entity type} of the entity to be created
     */
    createRaw<E extends rM.GenericEntity>(type: reflection.EntityType<E>, properties?: PartialProperties<E>): E;
    /**
     * Deletes an {@link rM.GenericEntity entity} from the {@link ManagedEntities.session|session}.
     * The deletion will be recorded as {@link mM.DeleteManipulation DeleteManipulation}
     * @param entity the {@link rM.GenericEntity entity} to be deleted
     */
    delete(entity: rM.GenericEntity): void;
    beginCompoundManipulation(): void;
    endCompoundManipulation(): void;
    compoundManipulation<R>(manipulator: () => R): R;
    /**
     * Establishes a state within the {@link ManagedEntities.session|session} by loading and appying changes from the event-source persistence.
     */
    load(): Promise<void>;
    /**
     * Persists the recorded and collected {@link mM.Manipulation manipulations} by appending them as a transaction to the event-source persistence.
     */
    commit(): Promise<void>;
    /**
     * Builds a select query from a GMQL select query statement which can then be equipped with variable values and executed.
     * @param statement a GMQL select query statement which may contain variables
     */
    selectQuery(statement: string): Promise<session.SelectQueryResultConvenience>;
    /**
     * Builds an entity query from a GMQL entity query statement which can then be equipped with variable values and executed.
     * @param statement a GMQL entity query statement which may contain variables
     */
    entityQuery(statement: string): Promise<session.EntityQueryResultConvenience>;
    /**
     * The in-memory OODB that keeps all the managed {@link rM.GenericEntity entities}, records changes on them as {@link mM.Manipulation manipulations}
     * and makes the entities and their properties accessible by queries.
     */
    session: session.ManagedGmSession;
}
