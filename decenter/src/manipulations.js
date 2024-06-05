import { reflection } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
var TypeCode = reflection.TypeCode;
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
        if (value == null)
            return null;
        switch (type.getTypeCode()) {
            case TypeCode.objectType: return this.valueAsJson(type.getActualType(value), value);
            case TypeCode.booleanType: return value;
            case TypeCode.stringType: return value;
            case TypeCode.integerType: return value;
            case TypeCode.longType: return toLongTuple(value);
            case TypeCode.floatType: return toFloatTuple(value);
            case TypeCode.decimalType: return toDecimalTuple(value);
            case TypeCode.doubleType: return toDoubleTuple(value);
            case TypeCode.dateType: return toDateTuple(value);
            case TypeCode.listType: return this.listAsJson(type, value);
            case TypeCode.setType: return this.setAsJson(type, value);
            case TypeCode.mapType: return this.mapAsJson(type, value);
            case TypeCode.entityType: return [value.id];
            case TypeCode.enumType:
                return toEnumTuple(type, value);
                break;
        }
        return null;
    }
    listAsJson(type, list) {
        return this.collectionAsJson("L", type, list);
    }
    setAsJson(type, set) {
        return this.collectionAsJson("S", type, set);
    }
    mapAsJson(type, map) {
        const keyType = type.getKeyType();
        const valueType = type.getValueType();
        const tuple = ["M"];
        for (const it = map.entrySet().iterator(); it.hasNext();) {
            const entry = it.next();
            const keyJson = this.valueAsJson(keyType, entry.getKey());
            const valueJson = this.valueAsJson(keyType, entry.getKey());
            tuple.push(keyJson);
            tuple.push(valueJson);
        }
        return tuple;
    }
    collectionAsJson(code, type, list) {
        const elementType = type.getCollectionElementType();
        const tuple = [code];
        for (const it = list.iterator(); it.hasNext();) {
            const json = this.valueAsJson(elementType, it.next());
            tuple.push(json);
        }
        return tuple;
    }
}
function toFloatTuple(floatValue) {
    return ["f", floatValue.floatValue()];
}
function toDoubleTuple(doubleValue) {
    return ["d", doubleValue];
}
function toDecimalTuple(decimal) {
    return ["D", decimal.toString()];
}
function toLongTuple(longValue) {
    return ["l", longValue.toString()];
}
function toDateTuple(date) {
    return [
        "t",
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDay(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
    ];
}
function toEnumTuple(type, enumValue) {
    return ["E", type.getTypeSignature(), enumValue.name()];
}
