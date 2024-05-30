import { eval_, service, session, modelpath, remote, reason, reflection, util } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import * as oM from "../com.braintribe.gm.owner-model-2.0~/ensure-owner-model.js";
import Manipulation = $T.com.braintribe.model.generic.manipulation.Manipulation;
import AtomicManipulation = $T.com.braintribe.model.generic.manipulation.AtomicManipulation;

interface TransactionCommons {
    author: string
    sequence: number
}

interface JsonTransaction extends TransactionCommons {
    version: string
    date: string
    diff: any[][]
}

interface Transaction extends TransactionCommons {
    date: Date
    diff: AtomicManipulation[]
}

class ManipulationMarshaller {

    async unmarshall(transactionStrings: string[]): Promise<Transaction[]> {
        const transactions = new Array<Transaction>();

        for (const s of transactionStrings) {
            const t = await this.transactionFromJsonString(s)
            transactions.push(t)
        }
        
        return transactions
    }

    async marshall(transactions: Transaction[]): Promise<string[]> {
        const transactionStrings = new Array<string>();

        for (const t of transactions) {
            const s = await this.transactionAsJsonString(t);
            transactionStrings.push(s)
        }
        
        return transactionStrings
    }

    async transactionAsJsonString(transaction: Transaction): Promise<string> {
        const t: JsonTransaction = await this.transactionAsJsonTransaction(transaction);
        return JSON.stringify(t);
    }

    async transactionAsJsonTransaction(transaction: Transaction): Promise<JsonTransaction> {
        const jsonTransaction = {} as JsonTransaction

        jsonTransaction.author = transaction.author
        jsonTransaction.sequence = transaction.sequence
        jsonTransaction.version = "1.0"
        jsonTransaction.date = transaction.date.toISOString()
        jsonTransaction.diff = await this.jsonDiffFromDiff(transaction.diff)

        return jsonTransaction
    }

    async transactionFromJsonString(s: string): Promise<Transaction> {
        const t = JSON.parse(s) as JsonTransaction;
        return this.transactionFromJsonTransaction(t);
    }

    async transactionFromJsonTransaction(jsonTransaction: JsonTransaction): Promise<Transaction> {
        const transaction = {} as Transaction

        transaction.author = jsonTransaction.author
        transaction.sequence = jsonTransaction.sequence
        transaction.date = new Date(transaction.date)
        transaction.diff = await this.diffFromJsonDiff(jsonTransaction.diff)

        return transaction
    }

    async diffFromJsonDiff(jsonDiff: any[][]): Promise<AtomicManipulation[]> {
        return null;
    }

    async jsonDiffFromDiff(diff: AtomicManipulation[]): Promise<any[][]> {
        return null;
    }

    manipulationAsJson(m: AtomicManipulation): any[] {
        switch (m.EntityType().getShortName()) {
            case "AcquireManipulation":
                const am = m as mM.AcquireManipulation
                return ["+", am.entityGlobalId, am.entity.EntityType().getTypeSignature()]

            case "DeleteManipulation":
                const dm = m as mM.DeleteManipulation
                return ["-", dm.entity.globalId]

            case "ChangeValueManipulation":
                const cm = m as mM.ChangeValueManipulation
                const owner = cm.owner as oM.LocalEntityProperty
                const property = owner.entity.EntityType().getProperty(owner.propertyName)
                return ["~", owner.entity.globalId, {[owner.propertyName]: this.valueAsJson(property.getType(), cm.newValue)}]

            case "AddManipulation":
                return []

            case "RemoveManipulation":
                return []

            case "ClearManipulation":
                return ["~", owner.entity.globalId, {[owner.propertyName]: ["c"]}]
        }
    }

    valueAsJson(type: reflection.GenericModelType, value: any): any {
        switch (type.getTypeCode()) {
            case reflection.TypeCode.booleanType:
            case reflection.TypeCode.stringType:
            case reflection.TypeCode.dateType:
            case reflection.TypeCode.dateType:
        }
        return null
    }
}