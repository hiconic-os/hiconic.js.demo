import { reflection, math, T } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import { CompoundManipulation, InstantiationManipulation, DeleteManipulation, ChangeValueManipulation, AddManipulation, RemoveManipulation, ClearCollectionManipulation, ManifestationManipulation } from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import * as vM from "../com.braintribe.gm.value-descriptor-model-2.0~/ensure-value-descriptor-model.js";
import * as oM from "../com.braintribe.gm.owner-model-2.0~/ensure-owner-model.js";
import * as rM from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";
import { Continuation } from "./continuation.js";
var TypeCode = reflection.TypeCode;
export class ManipulationMarshaller {
    constructor() {
        this.merges = new Array();
    }
    async marshalToString(manipulations) {
        const json = await this.marshalToJson(manipulations);
        const s = await new JsonStringifier().stringify(json);
        return s;
    }
    async marshalToJson(manipulations) {
        return await new ManipulationToJson().transform(manipulations);
    }
    async unmarshalFromString(s) {
        const json = JSON.parse(s);
        return await this.unmarshalFromJson(json);
    }
    async unmarshalFromJson(json) {
        return await new JsonToManipulation().transform(json);
    }
}
class JsonStringifier extends Continuation {
    async stringify(operations) {
        const buffer = new Array();
        buffer.push("[");
        let first = true;
        this.forEachOf(operations, op => {
            const s = JSON.stringify(op);
            if (first) {
                first = false;
                buffer.push("\n ");
            }
            else {
                buffer.push(",\n ");
            }
            buffer.push(s);
        });
        await this.wait();
        if (!first)
            buffer.push("\n");
        buffer.push("]");
        return buffer.join("");
    }
}
class ManipulationToJson extends Continuation {
    constructor() {
        super(...arguments);
        this.coalescing = new Array();
        this.jsonExperts = {
            objectType: (v, t) => { return this.valueToJson(t.getActualType(v), v); },
            stringType(v) { return v; },
            booleanType(v) { return v; },
            floatType(v) { return ["f", v.valueOf()]; },
            doubleType(v) { return ["d", v]; },
            decimalType(v) { return ["D", v.toString()]; },
            integerType(v) { return v; },
            longType(v) { return ["l", v.toString()]; },
            // TODO: ask Peter about presentation of enum
            enumType(v, t) { return ["E", t.getTypeSignature(), v.toString()]; },
            entitType(v) { return ["E", v.globalId]; },
            listType: (v, t) => { return this.listToJson(t, v); },
            setType: (v, t) => { return this.setToJson(t, v); },
            mapType: (v, t) => { return this.mapToJson(t, v); },
            dateType(v) {
                return ["t",
                    v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(),
                    v.getUTCHours(), v.getUTCMinutes(), v.getUTCSeconds(), v.getUTCMilliseconds()];
            },
        };
    }
    async transform(manipulations) {
        const json = new Array();
        // transform the manipulations into json structures and collect coalescings
        this.manipulationsToJson(manipulations, json);
        await this.wait();
        this.coalesceAll();
        await this.wait();
        return json;
    }
    coalesceAll() {
        this.forEachOf(this.coalescing, changes => this.coalesceChanges(changes));
    }
    coalesceChanges(changes) {
        let cvmOp;
        let args = new Array();
        const opIt = new PropertyOperationsIterator(changes.splice(2)[Symbol.iterator]());
        for (const curOp of opIt) {
            const kind = curOp[0];
            const data = curOp[1];
            if (kind == "=") {
                if (cvmOp) {
                    Object.assign(cvmOp[1], data);
                }
                else {
                    cvmOp = curOp;
                    args.push(data);
                }
            }
            else {
                cvmOp = null;
                args.push(kind);
                args.push(data);
            }
        }
        changes.push(...args);
    }
    manipulationToJson(m) {
        switch (m.EntityType()) {
            case ChangeValueManipulation: return this.changeValueToJson(m);
            case AddManipulation: return this.addToJson(m);
            case RemoveManipulation: return this.removeToJson(m);
            case InstantiationManipulation: return this.instantiationToJson(m);
            case ManifestationManipulation: return this.instantiationToJson(m);
            case CompoundManipulation: return this.compoundToJson(m);
            case DeleteManipulation: return this.deleteToJson(m);
            case ClearCollectionManipulation: return this.clearToJson(m);
        }
    }
    manipulationsToJson(manipulations, jsons) {
        let latestChange;
        let multiChange = false;
        this.forEachOf(manipulations, m => {
            const json = this.manipulationToJson(m);
            const op = json[0];
            if (op == "@") {
                const id = json[1];
                if (latestChange && latestChange[1] == id) {
                    if (!multiChange) {
                        multiChange = true;
                        this.coalescing.push(latestChange);
                    }
                    latestChange.push(...json.slice(2));
                    return;
                }
                else {
                    latestChange = json;
                    multiChange = false;
                }
            }
            else {
                latestChange = null;
                multiChange = false;
            }
            jsons.push(json);
        });
    }
    compoundToJson(m) {
        const json = ["*"];
        // TODO: shorten this if Iterable is supported
        const iterable = m.compoundManipulationList.values();
        this.manipulationsToJson(iterable, json);
        return json;
    }
    instantiationToJson(m) {
        const e = m.entity;
        return [">", e.globalId, e.EntityType().getTypeSignature()];
    }
    deleteToJson(m) {
        return ["<", m.entity.globalId];
    }
    changeValueToJson(m) {
        const [id, property, type] = this.owner(m);
        return ["@", id, { [property]: this.valueToJson(type, m.newValue) }];
    }
    addToJson(m) {
        return this.addOrRemoveToJson(m, m.itemsToAdd, "+");
    }
    removeToJson(m) {
        return this.addOrRemoveToJson(m, m.itemsToRemove, "-");
    }
    clearToJson(m) {
        const [id, property, type] = this.owner(m);
        return ["@", id, "~", [property]];
    }
    addOrRemoveToJson(m, itemsToAddOrRemove, op) {
        const [id, property, type] = this.owner(m);
        let items;
        switch (type.getTypeCode()) {
            case TypeCode.objectType:
            case TypeCode.mapType:
                items = this.mapToJson(type, itemsToAddOrRemove);
                break;
            case TypeCode.listType:
                const listType = type;
                const listMapType = reflection.typeReflection().getMapType(reflection.EssentialTypes.INTEGER, listType.getCollectionElementType());
                items = this.mapToJson(listMapType, itemsToAddOrRemove);
                break;
            case TypeCode.setType:
                const setType = type;
                // TODO: ask Peter about naming of our collections in general
                const set = new T.Setish();
                itemsToAddOrRemove.forEach(e => set.add(e));
                items = this.setToJson(setType, set);
                break;
        }
        return ["@", id, op, { [property]: items }];
    }
    owner(m) {
        const owner = m.owner;
        const entity = owner.entity;
        const property = entity.EntityType().getProperty(owner.propertyName);
        return [entity.globalId, property.getName(), property.getType()];
    }
    valueToJson(type, value) {
        if (value == null)
            return null;
        const expert = this.jsonExperts[type.getTypeCode().toString()];
        if (!expert)
            // TODO: reasoning
            throw new Error("unkown typecode " + type.getTypeCode());
        return expert(value, type);
    }
    mapToJson(t, v) {
        const keyType = t.getKeyType();
        const valueType = t.getValueType();
        const tuple = ["M"];
        this.forEachOf(v.entries(), e => {
            const keyJson = this.valueToJson(keyType, e[0]);
            const valueJson = this.valueToJson(valueType, e[1]);
            tuple.push(keyJson, valueJson);
        });
        return tuple;
    }
    setToJson(t, v) {
        // TODO: shorten this if Iterable is supported
        const iterable = v.values();
        return this.collectionToJson("S", t, iterable);
    }
    listToJson(t, v) {
        // TODO: shorten this if Iterable is supported
        const iterable = v.values();
        return this.collectionToJson("L", t, iterable);
    }
    collectionToJson(code, type, collection) {
        const elementType = type.getCollectionElementType();
        const tuple = [code];
        this.forEachOf(collection, element => {
            const json = this.valueToJson(elementType, element);
            tuple.push(json);
        });
        return tuple;
    }
}
class JsonToManipulation extends Continuation {
    constructor() {
        super(...arguments);
        this.entities = new Map();
        this.manipulationExperts = {
            ["*"]: (json, consumer) => {
                const m = CompoundManipulation.create();
                const manipulations = m.compoundManipulationList;
                const adder = manipulations.push.bind(manipulations);
                this.forEachOf(json, j => this.jsonToManipulations(j, adder));
            },
            [">"]: (json, consumer) => {
                const tuple = json;
                const m = InstantiationManipulation.create();
                m.entity = this.entity(tuple[2], tuple[1]);
                consumer(m);
            },
            ["<"]: (json, consumer) => {
                const tuple = json;
                const m = DeleteManipulation.create();
                m.entity = this.entity(tuple[1]);
                consumer(m);
            },
            ["@"]: (json, consumer) => {
                const tuple = json;
                const id = tuple[1];
                const entity = this.entity(id);
                const it = tuple[Symbol.iterator]();
                // wind iterator two times to move the property manipulation elements
                it.next();
                it.next();
                const opIt = new PropertyOperationsIterator(it);
                this.forEachOfIterator(opIt, op => this.decodePropertyOperation(entity, op, consumer));
            }
        };
        this.propertyExperts = {
            ["="]: (e, o, consumer) => {
                this.forEachOf(Object.entries(o), entry => {
                    const m = ChangeValueManipulation.create();
                    m.owner = this.entityProperty(e, entry[0]);
                    m.newValue = this.jsonToValue(entry[1]);
                    consumer(m);
                });
            },
            ["+"]: (e, o, consumer) => {
                this.forEachOf(Object.entries(o), entry => {
                    const m = AddManipulation.create();
                    m.owner = this.entityProperty(e, entry[0]);
                    let type;
                    const items = this.jsonToValue(entry[1], t => type = t);
                    m.itemsToAdd = this.mappify(items, type);
                    consumer(m);
                });
            },
            ["-"]: (e, o, consumer) => {
                this.forEachOf(Object.entries(o), entry => {
                    const m = RemoveManipulation.create();
                    m.owner = this.entityProperty(e, entry[0]);
                    let type;
                    const items = this.jsonToValue(entry[1], t => type = t);
                    m.itemsToRemove = this.mappify(items, type);
                    consumer(m);
                });
            },
            ["~"]: (e, o, consumer) => {
                const properties = o;
                this.forEachOf(properties, property => {
                    const m = ClearCollectionManipulation.create();
                    m.owner = this.entityProperty(e, property);
                    consumer(m);
                });
            },
        };
        this.valueExperts = {
            string(json, tc) { tc?.(reflection.EssentialTypes.STRING); return json; },
            boolean(json, tc) { tc?.(reflection.EssentialTypes.BOOLEAN); return json; },
            number(json, tc) { tc?.(reflection.EssentialTypes.INTEGER); return json; },
            object: (json, tc) => {
                const op = json[0];
                return this.exValueExperts[op](json, tc);
            }
        };
        this.exValueExperts = {
            // base types: f = float, d = double, l = long,
            f(json, tc) { tc?.(reflection.EssentialTypes.FLOAT); return new T.Float(json[1]); },
            d(json, tc) { tc?.(reflection.EssentialTypes.DOUBLE); return new T.Double(json[1]); },
            l(json, tc) { tc?.(reflection.EssentialTypes.LONG); return BigInt(json[1]); },
            D(json, tc) { tc?.(reflection.EssentialTypes.DECIMAL); return math.bigDecimalFromString(json[1]); },
            t(json, tc) { tc?.(reflection.EssentialTypes.DATE); return new Date(Date.UTC.apply(null, json.slice[1])); },
            L: (json, tc) => {
                tc?.(reflection.EssentialTypes.LIST);
                const list = new T.Arrayish();
                const it = json[Symbol.iterator]();
                // eat up type-code so that only elements remain
                it.next();
                this.forEachOf(it, e => list.push(this.jsonToValue(e)));
                return list;
            },
            // decode Set
            S(json, tc) {
                tc?.(reflection.EssentialTypes.SET);
                const set = new T.Setish();
                const it = json[Symbol.iterator]();
                // eat up type-code so that only elements remain
                it.next();
                this.forEachOf(it, e => set.add(this.jsonToValue(e)));
                return set;
            },
            // decode Map
            M(json, tc) {
                tc?.(reflection.EssentialTypes.MAP);
                const map = new T.Mapish();
                const it = json[Symbol.iterator]();
                // eat up type-code so that only elements remain
                it.next();
                let key = undefined;
                this.forEachOf(it, e => {
                    if (key === undefined) {
                        key = this.jsonToValue(e);
                    }
                    else {
                        const value = this.jsonToValue(e);
                        map.set(key, value);
                        key = undefined;
                    }
                });
                return map;
            },
            E(json, tc) {
                const id = json[1];
                const ref = vM.GlobalEntityReference.create();
                ref.refId = id;
                ref.typeSignature = rM.GenericEntity.getTypeSignature();
                tc?.(rM.GenericEntity);
                return ref;
            },
            e(json, tc) {
                const tuple = json;
                const type = reflection.typeReflection().getEnumTypeBySignature(tuple[1]);
                tc?.(type);
                return type.findEnumValue(tuple[2]);
            },
        };
    }
    async transform(json) {
        const array = json;
        const manipulations = new Array();
        const adder = manipulations.push.bind(manipulations);
        this.forEachOf(array, j => this.jsonToManipulations(j, adder));
        // wait for the continuation to end
        await this.wait();
        return manipulations;
    }
    jsonToManipulations(json, consumer) {
        const op = json[0];
        this.manipulationExperts[op](json, consumer);
    }
    jsonToValue(json, typeConsumer) {
        if (json == null) {
            typeConsumer?.(reflection.EssentialTypes.TYPE_OBJECT);
            return null;
        }
        return this.valueExperts[typeof json](json);
    }
    entity(id, typeSignature) {
        let e = this.entities.get(id);
        if (e)
            return e;
        const ref = vM.GlobalEntityReference.create();
        ref.refId = id;
        ref.typeSignature = typeSignature || rM.GenericEntity.getTypeSignature();
        this.entities.set(id, ref);
        return ref;
    }
    entityProperty(entity, property) {
        const eP = oM.EntityProperty.create();
        eP.reference = entity;
        eP.propertyName = property;
        return eP;
    }
    decodePropertyOperation(entity, opTuple, consumer) {
        this.propertyExperts[opTuple[0]](entity, opTuple[1], consumer);
    }
    mappify(value, type) {
        switch (type.getTypeCode()) {
            case TypeCode.mapType: return value;
            case TypeCode.setType:
            case TypeCode.listType: {
                const c = value;
                const m = new T.Mapish();
                for (const e of c.iterable())
                    m.set(e, e);
                return m;
            }
            default: {
                const m = new T.Mapish();
                m.set(value, value);
                return m;
            }
        }
    }
}
class PropertyOperationsIterator {
    constructor(it) {
        this.it = it;
    }
    [Symbol.iterator]() {
        return this;
    }
    next() {
        const r = this.it.next();
        if (r.done)
            return { done: true, value: undefined };
        const candidate = r.value;
        if (typeof candidate == 'string') {
            const operandR = this.it.next();
            if (operandR.done)
                // TODO: property reasoning with reason entities
                throw "Unexpected End of array";
            return { done: false, value: [candidate, operandR.value] };
        }
        else {
            return { done: false, value: ["=", candidate] };
        }
    }
}
