import { eval_, service, session, modelpath, remote, reason, reflection, util, lang } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import * as oM from "../com.braintribe.gm.owner-model-2.0~/ensure-owner-model.js";
import * as rM from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";

import TypeCode = reflection.TypeCode

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
    diff: mM.AtomicManipulation[]
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

    async diffFromJsonDiff(jsonDiff: any[][]): Promise<mM.AtomicManipulation[]> {
        return null;
    }

    async jsonDiffFromDiff(diff: mM.AtomicManipulation[]): Promise<any[][]> {
        return null;
    }

    manipulationAsJson(m: mM.AtomicManipulation): any[] {
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
        if (value == null)
            return null;

        switch (type.getTypeCode()) {
            case TypeCode.objectType: return this.valueAsJson(type.getActualType(value), value);

            case TypeCode.booleanType: return value;
            case TypeCode.stringType: return value;
            case TypeCode.integerType: return value;

            case TypeCode.longType: return toLongTuple(value as lang.Long);
            case TypeCode.floatType: return toFloatTuple(value as lang.Float);
            case TypeCode.decimalType: return toDecimalTuple(value as lang.BigDecimal);
            case TypeCode.doubleType: return toDoubleTuple(value as number);

            case TypeCode.dateType: return toDateTuple(value as Date);

            case TypeCode.listType: return this.listAsJson(type as reflection.ListType, value as lang.List<any>);
            case TypeCode.setType: return this.setAsJson(type as reflection.SetType, value as lang.Set<any>);
            case TypeCode.mapType: return this.mapAsJson(type as reflection.MapType, value as lang.Map<any, any>);

            case TypeCode.entityType: return [(value as rM.GenericEntity).id]
            case TypeCode.enumType: return toEnumTuple(type as reflection.EnumType, value as lang.Enum<any>);
            
            break;
        }
        return null
    }

    listAsJson(type: reflection.ListType, list: lang.List<any>): CollectionTuple {
        return this.collectionAsJson("L", type, list);
    }

    setAsJson(type: reflection.SetType, set: lang.Set<any>): CollectionTuple {
        return this.collectionAsJson("S", type, set);
    }

    mapAsJson(type: reflection.MapType, map: lang.Map<any, any>): CollectionTuple {
        const keyType = type.getKeyType();
        const valueType = type.getValueType();
        const tuple: CollectionTuple = ["M"];


        for (const it = map.entrySet().iterator(); it.hasNext();) {
            const entry = it.next();
            
            const keyJson = this.valueAsJson(keyType, entry.getKey());
            const valueJson = this.valueAsJson(keyType, entry.getKey());

            tuple.push(keyJson);
            tuple.push(valueJson);
        }
    
        return tuple;
    }

    collectionAsJson(code: string, type: reflection.LinearCollectionType, list: lang.Collection<any>): CollectionTuple {
        const elementType = type.getCollectionElementType();
        const tuple: CollectionTuple = [code];

        for (const it = list.iterator(); it.hasNext();) {
            const json = this.valueAsJson(elementType, it.next());
            tuple.push(json);
        }
    
        return tuple;
    }
}

type EnumTuple = [type: string, type: string, constant: string];
type DoubleTuple = [type: string, type: number];
type FloatTuple = [type: string, type: number];
type LongTuple = [type: string, type: string];
type DecimalTuple = [type: string, type: string];
type DateTuple = [type: string, year: number, month: number, day: number, hours: number, minutes: number, seconds: number, milliseconds: number];

type CollectionTuple = [type: string, ...elements: any];

function toFloatTuple(floatValue: lang.Float): FloatTuple {
    return ["f", floatValue.floatValue()];
}

function toDoubleTuple(doubleValue: number): DoubleTuple {
    return ["d", doubleValue];
}

function toDecimalTuple(decimal: lang.BigDecimal): DecimalTuple {
    return ["D", decimal.toString()];
}

function toLongTuple(longValue: lang.Long): LongTuple {
    return ["l", longValue.toString()];
}

function toDateTuple(date: Date): DateTuple {
    return [
        "t",
        date.getUTCFullYear(), 
        date.getUTCMonth(), 
        date.getUTCDay(), 
        date.getUTCHours(), 
        date.getUTCMinutes(), 
        date.getUTCSeconds(), 
        date.getUTCMilliseconds()];
}

function toEnumTuple(type: reflection.EnumType, enumValue: lang.Enum<any>): EnumTuple {
    return ["E", type.getTypeSignature(), enumValue.name()];
}