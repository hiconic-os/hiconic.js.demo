import * as hc from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js"
import { ManagedEntities, openEntities } from "./managed-entities.js"
import * as m from "../hiconic.js.demo.decenter-model-1.0~/ensure-decenter-model.js"

const names = [
    "John", "Peter", "Christian", "Samantha", "Mary", "Linda", "Sandy", "Lucas", "Wilma", "Marcus", "Johanna", "Willy", "Charles", "Doris", "Thelma", "Otto", "",

]
const lastNames = ["Miller", "Fox", "Smith", "Baker", "Jackson", "Wheeler", "Shepard", "Foster", "Turner", "Walker", "Spencer"]

function getRandomInt(min: number, max: number): number {
    // Ensure min and max are integers
    min = Math.ceil(min)
    max = Math.floor(max)
    
    // Swap min and max if min is greater than max
    if (min > max) {
        [min, max] = [max, min]
    }
    
    // Generate random integer within the range
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main(): Promise<void> {
    const managedEntities = openEntities("test")
    await managedEntities.load()
    
    const person = newPerson(managedEntities)
    
    await managedEntities.commit()



    const results: hc.lang.List<m.Person> = (await managedEntities.session.query().entitiesString("from " + m.Person.getTypeSignature())).list()

    const count = results.size()

    for (let i = 0; i < count; i++) {
        const p = results.getAtIndex(i)
        console.log(p.name + " " + p.lastName + ", email: " + p.email)
    }
}

function newPerson(managedEntities: ManagedEntities): m.Person {
    const person = managedEntities.session.create(m.Person)
    person.name = names[getRandomInt(0, names.length - 1)]
    person.lastName = lastNames[getRandomInt(0, lastNames.length - 1)]
    person.email = person.name + "." + person.lastName + "@unnamed.com"

    return person
}

main()





