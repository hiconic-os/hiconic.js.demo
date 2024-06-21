import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js"
import { T, math} from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js"
import { ManagedEntities, openEntities } from "./managed-entities.js"
import { JackOfAllTraits, Person } from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js"
import { Manipulation, CompoundManipulation, 
    InstantiationManipulation, DeleteManipulation, 
    PropertyManipulation, ChangeValueManipulation, 
    AddManipulation, RemoveManipulation, 
    ClearCollectionManipulation } from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
import * as marshaling from "./manipulation-marshaler.js";
import { GenericEntity } from "../com.braintribe.gm.root-model-2.0~/ensure-root-model.js";

function create<E extends GenericEntity>(session: hc.session.ManagedGmSession, type: hc.reflection.EntityType<E>): E {
    const m = InstantiationManipulation.create();
    const e = type.create();
    e.globalId = hc.util.newUuid();
    m.entity = e;
    session.manipulate().mode(hc.session.ManipulationMode.LOCAL).apply(m);
    return e;
}

async function main() {
    const session = new hc.session.BasicManagedGmSession()

    const manipulations = new Array<Manipulation>();

    session.listeners().add({ onMan: m => manipulations.push(m) });

    const person = create(session, Person);

    person.name = "Christina";
    person.lastName = "Wilpernig";
    person.birthday = new Date(Date.UTC(1990, 9, 10));
    person.email = "chistina.wilpernig@gmail.com";

    // const jack1 = createJack1(session);

    const marshaler = new marshaling.ManipulationMarshaller();

    const json = await marshaler.marshalToString(manipulations);

    console.log(json);

}

main();

function createJack1(session: hc.session.BasicManagedGmSession): JackOfAllTraits {
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
    jack.doubleValue = Math.PI as any;
    jack.decimalValue = math.bigDecimalFromString("4.669201609102990671853203820466201617258");
    jack.floatValue = new T.Float(Math.E);

    // list
    jack.stringList.push(...["one", "two", "three"]);

    // const myMap: map<string, string> = hc.reflection.EssentialTypes.MAP.createPlain();

    // let myMap: map<string, string>; // Map<string, string>, T.Map<string, string>

    // const mapish = new T.Mapish<string, long>();
    // mapish.set("one", BigInt(1));

    // jack.longMap = mapish;
    // const m = jack.longMap;
    // console.log(m.size);

    return jack;
}

