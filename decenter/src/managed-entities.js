/// <reference path="../tribefire.js.gwt-basic-managed-gm-session-3.0~/gwt-basic-managed-gm-session.d.ts" />
/// <reference path="../tribefire.js.tribefire-js-module-3.0~/tribefire-js-module.d.ts" />
import { session, util, manipulation } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import { SessionManipulationBuffer } from "./manipulation-buffer.js";
/**
 * Opens a {@link ManagedEntities} instance backed by the indexedDB named "event-source-db".
 * @param databaseName name of the ObjectStore used as space for the stored events
 */
export function openEntities(databaseName) {
    return new ManagedEntitiesImpl(databaseName);
}
/**
 * Implementation of {@link ManagedEntities} that uses {@link indexedDB} as event-source persistence.
 */
class ManagedEntitiesImpl {
    constructor(databaseName) {
        this.session = new session.BasicManagedGmSession();
        this.databaseName = databaseName;
        this.manipulationBuffer = new SessionManipulationBuffer(this.session);
    }
    create(type, properties) {
        const e = this.session.createEntity(type).globalWithRandomUuid();
        properties || Object.assign(e, properties);
        return e;
    }
    createRaw(type, properties) {
        const e = this.session.createEntity(type).raw().globalWithRandomUuid();
        properties || Object.assign(e, properties);
        return e;
    }
    initAndAttach(entity, properties) {
        if (!entity.globalId)
            entity.globalId = util.newUuid();
        const m = mM.InstantiationManipulation.create();
        m.entity = entity;
        this.session.manipulate().mode(session.ManipulationMode.LOCAL).apply(m);
        return entity;
    }
    delete(entity) {
        this.session.deleteEntity(entity);
    }
    beginCompoundManipulation() {
        this.manipulationBuffer.beginCompoundManipulation();
    }
    endCompoundManipulation() {
        this.manipulationBuffer.endCompoundManipulation();
    }
    compoundManipulation(manipulator) {
        return this.manipulationBuffer.compoundManipulation(manipulator);
    }
    async selectQuery(statement) {
        return this.session.query().selectString(statement);
    }
    async entityQuery(statement) {
        return this.session.query().entitiesString(statement);
    }
    async load() {
        // get database and fetch all transaction records from it
        let transactions = await (await this.getDatabase()).fetch();
        transactions = this.orderByDependency(transactions);
        this.manipulationBuffer.clear();
        this.manipulationBuffer.suspendTracking();
        try {
            for (const t of transactions) {
                const m = await manipulation.ManipulationSerialization.deserializeManipulation(t.diff);
                this.session.manipulate().mode(session.ManipulationMode.REMOTE).apply(m);
            }
        }
        finally {
            this.manipulationBuffer.resumeTracking();
        }
        // remember the id of the last transaction for linkage with an new transaction
        if (transactions.length > 0)
            this.lastTransactionId = transactions[transactions.length - 1].id;
    }
    async commit() {
        const manis = this.manipulationBuffer.getCommitManipulations();
        // serialize the manipulations (currently as XML)
        const diff = await manipulation.ManipulationSerialization.serializeManipulations(manis, true);
        // build a transaction record equipped with a new UUID, date and the serialized manipulations
        const transaction = {};
        transaction.id = util.newUuid();
        transaction.diff = diff;
        transaction.date = new Date().getTime();
        transaction.deps = [];
        // link the transaction to a previous one if present
        if (this.lastTransactionId !== undefined)
            transaction.deps.push(this.lastTransactionId);
        // append the transaction record to the database
        await (await this.getDatabase()).append(transaction);
        // clear the manipulations as they are persisted
        this.manipulationBuffer.clear();
        // store the id of the appended transaction as latest transaction id
        this.lastTransactionId = transaction.id;
    }
    async getDatabase() {
        if (this.databasePromise === undefined)
            this.databasePromise = Database.open(this.databaseName);
        return this.databasePromise;
    }
    orderByDependency(transactions) {
        const index = new Map();
        for (const t of transactions) {
            index.set(t.id, t);
        }
        const visited = new Set();
        const collect = new Array();
        for (const t of transactions) {
            this.collect(t, visited, collect, index);
        }
        return collect;
    }
    collect(transaction, visited, collect, index) {
        if (visited.has(transaction))
            return;
        visited.add(transaction);
        for (const dep of transaction.deps) {
            const depT = index.get(dep);
            this.collect(depT, visited, collect, index);
        }
        collect.push(transaction);
    }
}
/**
 * An append-only persistence for {@link Transaction transactions} based on {@link indexedDB}.
 *
 * It allows to {@link Database.fetch|fetch} and {@link Database.append|append} {@link Transaction transactions}
 */
class Database {
    static async open(databaseName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("event-source-db", 2);
            const db = new Database();
            db.databaseName = databaseName;
            request.onupgradeneeded = () => db.init(request.result);
            request.onsuccess = () => {
                db.db = request.result;
                resolve(db);
            };
            request.onerror = () => reject(request.error);
        });
    }
    async fetch() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.databaseName], 'readonly');
            const objectStore = transaction.objectStore(this.databaseName);
            const request = objectStore.getAll();
            const transactions = new Array();
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }
    append(transaction) {
        return new Promise((resolve, reject) => {
            const dbTransaction = this.db.transaction([this.databaseName], 'readwrite');
            const objectStore = dbTransaction.objectStore(this.databaseName);
            const request = objectStore.add(transaction);
            request.onsuccess = () => {
                resolve(null);
            };
            request.onerror = () => reject(request.error);
        });
    }
    init(db) {
        if (!db.objectStoreNames.contains(this.databaseName)) {
            db.createObjectStore(this.databaseName, { keyPath: 'id' });
        }
    }
}
