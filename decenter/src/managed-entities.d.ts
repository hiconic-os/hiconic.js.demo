/// <reference path="../sources/tribefire.js.gwt-basic-managed-gm-session-3.0~/gwt-basic-managed-gm-session.d.ts" />
/// <reference path="../sources/tribefire.js.tribefire-js-module-3.0~/tribefire-js-module.d.ts" />
import { session, reflection } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import * as rM from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";
export type ManipulationListener = (manipulation: mM.AtomicManipulation) => void;
export interface ManagedEntities {
    create<E extends rM.GenericEntity>(type: reflection.EntityType<E>): E;
    load(): Promise<void>;
    commit(): Promise<void>;
    addManipulationListener(listener: ManipulationListener): void;
    session: session.ManagedGmSession;
}
export declare function openEntities(databaseName: string): ManagedEntities;
