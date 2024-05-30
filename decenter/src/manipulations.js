import { reflection } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
class ManipulationMarshaller {
    async unmarshall(transactionStrings) {
        const transactions = new Array();
        for (const s of transactionStrings) {
            const t = await this.transactionFromJsonString(s);
            transactions.push(t);
        }
        return transactions;
    }
    async marshall(transactions) {
        const transactionStrings = new Array();
        for (const t of transactions) {
            const s = await this.transactionAsJsonString(t);
            transactionStrings.push(s);
        }
        return transactionStrings;
    }
    async transactionAsJsonString(transaction) {
        const t = await this.transactionAsJsonTransaction(transaction);
        return JSON.stringify(t);
    }
    async transactionAsJsonTransaction(transaction) {
        const jsonTransaction = {};
        jsonTransaction.author = transaction.author;
        jsonTransaction.sequence = transaction.sequence;
        jsonTransaction.version = "1.0";
        jsonTransaction.date = transaction.date.toISOString();
        jsonTransaction.diff = await this.jsonDiffFromDiff(transaction.diff);
        return jsonTransaction;
    }
    async transactionFromJsonString(s) {
        const t = JSON.parse(s);
        return this.transactionFromJsonTransaction(t);
    }
    async transactionFromJsonTransaction(jsonTransaction) {
        const transaction = {};
        transaction.author = jsonTransaction.author;
        transaction.sequence = jsonTransaction.sequence;
        transaction.date = new Date(transaction.date);
        transaction.diff = await this.diffFromJsonDiff(jsonTransaction.diff);
        return transaction;
    }
    async diffFromJsonDiff(jsonDiff) {
        return null;
    }
    async jsonDiffFromDiff(diff) {
        return null;
    }
    manipulationAsJson(m) {
        switch (m.EntityType().getShortName()) {
            case "AcquireManipulation":
                const am = m;
                return ["+", am.entityGlobalId, am.entity.EntityType().getTypeSignature()];
            case "DeleteManipulation":
                const dm = m;
                return ["-", dm.entity.globalId];
            case "ChangeValueManipulation":
                const cm = m;
                const owner = cm.owner;
                const property = owner.entity.EntityType().getProperty(owner.propertyName);
                return ["~", owner.entity.globalId, { [owner.propertyName]: this.valueAsJson(property.getType(), cm.newValue) }];
            case "AddManipulation":
                return [];
            case "RemoveManipulation":
                return [];
            case "ClearManipulation":
                return ["~", owner.entity.globalId, { [owner.propertyName]: ["c"] }];
        }
    }
    valueAsJson(type, value) {
        switch (type.getTypeCode()) {
            case reflection.TypeCode.booleanType:
            case reflection.TypeCode.stringType:
            case reflection.TypeCode.dateType:
            case reflection.TypeCode.dateType:
        }
        return null;
    }
}
