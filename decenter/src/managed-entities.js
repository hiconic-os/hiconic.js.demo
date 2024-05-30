/// <reference path="../tribefire.js.gwt-basic-managed-gm-session-3.0~/gwt-basic-managed-gm-session.d.ts" />
/// <reference path="../tribefire.js.tribefire-js-module-3.0~/tribefire-js-module.d.ts" />
import { session, util, manipulation } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
export function openEntities(databaseName) {
    return new ManagedEntitiesImpl(databaseName);
}
class ManagedEntitiesImpl {
    constructor(databaseName) {
        this.session = new session.BasicManagedGmSession();
        this.manipulations = new Array();
        this.session.listeners().add(this);
        this.databaseName = databaseName;
    }
    create(type) {
        return this.session.acquire(type, util.newUuid());
    }
    onMan(manipulation) {
        this.manipulations.push(manipulation);
    }
    async load() {
        let transactions = await (await this.getDatabase()).fetch();
        this.orderByDependency(transactions);
        for (const t of transactions) {
            const m = await manipulation.ManipulationSerialization.deserializeManipulation(t.diff);
            this.session.manipulate().mode(session.ManipulationMode.REMOTE).apply(m);
        }
        if (transactions.length > 0)
            this.lastTransactionId = transactions[transactions.length - 1].id;
    }
    async commit() {
        const manis = this.manipulations;
        const diff = await manipulation.ManipulationSerialization.serializeManipulations(manis, true);
        const transaction = {};
        transaction.id = util.newUuid();
        transaction.diff = diff;
        transaction.date = new Date().getTime();
        transaction.deps = [];
        if (this.lastTransactionId !== undefined)
            transaction.deps.push(this.lastTransactionId);
        await (await this.getDatabase()).append(transaction);
        this.manipulations = [];
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
