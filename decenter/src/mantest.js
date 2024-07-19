import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import { T, math } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import { JackOfAllTraits } from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js";
import * as marshaling from "./manipulation-marshaler.js";
function create(session, type) {
    return session.createEntity(type).globalWithRandomUuid();
}
async function main() {
    const session = new hc.session.BasicManagedGmSession();
    const manipulations = new Array();
    session.listeners().add({ onMan: m => manipulations.push(m) });
    // const person = create(session, Person);
    // person.name = "Christina";
    // person.lastName = "Wilpernig";
    // person.birthday = new Date(Date.UTC(1990, 9, 10));
    // person.email = "chistina.wilpernig@gmail.com";
    const jack1 = createJack1(session);
    const marshaler = new marshaling.ManipulationMarshaller();
    const json = await marshaler.marshalToString(manipulations);
    console.log(json);
}
main();
function createJack1(session) {
    const jack = create(session, JackOfAllTraits);
    // json primitives
    jack.stringValue = "Hello World!";
    jack.booleanValue = true;
    jack.integerValue = 23;
    // remaining js primitives
    jack.longValue = BigInt("1234567890987654321");
    jack.dateValue = new Date(Date.UTC(1976, 0, 14));
    // remaining hiconic primitives
    // jack.doubleValue = new T.Double(Math.PI);
    jack.doubleValue = Math.PI;
    jack.decimalValue = math.bigDecimalFromString("4.669201609102990671853203820466201617258");
    jack.floatValue = new T.Float(Math.E);
    // list
    jack.stringList.push(...["one", "two", "three"]);
    jack.longMap.set("one", 1n);
    jack.longMap.set("two", 1n);
    const m = new T.Map();
    m.set("self", jack);
    jack.entityMap = m;
    return jack;
}
