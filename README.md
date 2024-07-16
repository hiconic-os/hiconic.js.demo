# Run the demo

- Move to project `decenter`
- If needed, install http-server: `npm install -g http-server`
- Run `npm start`
- Open browser on `localhost:8080`

## Basic Principles

### Prepare and load session

```typescript
const managedEntities = openEntities("person-index")

async function main(): Promise<void> {
    await managedEntities.load()
}
```

### Create new entity

```typescript
const person = managedEntities.create(m.Person);
person.name = name
person.lastName = lastName
person.birthday = hc.time.fromJsDate(birthday as any)
person.email = email
```

### Delete an entity

```typescript
managedEntities.session.deleteEntity(person);
```

### Amount of manipulations tracked
```typescript
managedEntities.addManipulationListener(m => buttonSave.style.visibility = "visible")

const manCount = managedEntities.manipulations.length
await managedEntities.commit()


```
