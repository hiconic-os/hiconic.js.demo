/// <reference path="../tribefire.js.gwt-basic-managed-gm-session-3.0~/gwt-basic-managed-gm-session.d.ts" />
/// <reference path="../tribefire.js.tribefire-js-module-3.0~/tribefire-js-module.d.ts" />
import { eval_, service, session, modelpath, remote, reason, reflection, util, manipulation } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import * as rM from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";

export interface ManagedEntities {
    create<E extends rM.GenericEntity>(type: reflection.EntityType<E>): E
    load(): Promise<void>
    commit(): Promise<void>
    session: session.ManagedGmSession
}

export function openEntities(databaseName: string): ManagedEntities {
    return new ManagedEntitiesImpl(databaseName)
}

class ManagedEntitiesImpl implements ManagedEntities, manipulation.ManipulationListener {
    readonly session = new session.BasicManagedGmSession()
    
    manipulations = new Array<mM.Manipulation>()
    databasePromise: Promise<Database>
    lastTransactionId: string
    databaseName: string

    constructor(databaseName: string) {
        this.session.listeners().add(this)
        this.databaseName = databaseName
    }

    create<E extends $T.com.braintribe.model.generic.GenericEntity>(type: reflection.EntityType<E>): E {
        return this.session.acquire(type, util.newUuid());
    }

    onMan(manipulation: mM.Manipulation): void {
        this.manipulations.push(manipulation);
    }

    async load(): Promise<void> {
        let transactions = await (await this.getDatabase()).fetch()
        this.orderByDependency(transactions)

        for (const t of transactions) {
            const m = await manipulation.ManipulationSerialization.deserializeManipulation(t.diff);
            this.session.manipulate().mode(session.ManipulationMode.REMOTE).apply(m)
        }

        if (transactions.length > 0)
            this.lastTransactionId = transactions[transactions.length - 1].id
    }

    async commit(): Promise<void> {
        const manis = this.manipulations
        const diff = await manipulation.ManipulationSerialization.serializeManipulations(manis, true)
        const transaction = {} as Transaction
        transaction.id = util.newUuid()
        transaction.diff = diff
        transaction.date = new Date().getTime()
        transaction.deps = []
        
        if (this.lastTransactionId !== undefined)
            transaction.deps.push(this.lastTransactionId)

        await (await this.getDatabase()).append(transaction)

        this.manipulations = []
        
        this.lastTransactionId = transaction.id
    }

    private async getDatabase(): Promise<Database> {
        if (this.databasePromise === undefined)
            this.databasePromise = Database.open(this.databaseName);

        return this.databasePromise;
    }


    private orderByDependency(transactions: Transaction[]): Transaction[] {
        const index = new Map<string, Transaction>();
        
        for (const t of transactions) {
            index.set(t.id, t)
        }

        const visited = new Set<Transaction>();
        const collect = new Array<Transaction>();

        for (const t of transactions) {
            this.collect(t, visited, collect, index)
        }

        return collect
    }

    private collect(transaction: Transaction, visited: Set<Transaction>, collect: Array<Transaction>, index: Map<string, Transaction>): void {
        if (visited.has(transaction))
            return

        visited.add(transaction)

        for (const dep of transaction.deps) {
            const depT = index.get(dep)
            this.collect(depT, visited, collect, index)
        }

        collect.push(transaction)
    }

}

interface Transaction {
    deps: string[]
    id: string
    diff: string
    date: number
}

class Database {

    private db: IDBDatabase;
    private databaseName: string;

    static async open(databaseName: string): Promise<Database> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("event-source-db", 2);
            
            const db = new Database()
            db.databaseName = databaseName

            request.onupgradeneeded = () => db.init(request.result)
            
            request.onsuccess = () => {
                db.db = request.result
                
                resolve(db)
            }

            request.onerror = () => reject(request.error)
        });
    }

    async fetch(): Promise<Transaction[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.databaseName], 'readonly');
            const objectStore = transaction.objectStore(this.databaseName);
    
            const request = objectStore.getAll();
            const transactions = new Array<Transaction>();

            request.onsuccess = () => {
                resolve(request.result)
            }
    
            request.onerror = () => reject(request.error)
        });
    }

    append(transaction: Transaction): Promise<void> {
        return new Promise((resolve, reject) => {
            const dbTransaction = this.db.transaction([this.databaseName], 'readwrite');
            const objectStore = dbTransaction.objectStore(this.databaseName);
    
            const request = objectStore.add(transaction)
            
            request.onsuccess = () => {
                resolve(null)
            }
    
            request.onerror = () => reject(request.error)
        });
    }

    private init(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains(this.databaseName)) {
            db.createObjectStore(this.databaseName, { keyPath: 'id' });
        }
    }


}