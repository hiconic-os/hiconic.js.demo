import { Resource } from "../com.braintribe.gm.resource-model-2.0~/ensure-resource-model.js";
function create(type, initializer) {
    const entity = type.create();
    initializer || Object.assign(entity, initializer);
    return entity;
}
create(Resource, {
    name: "resource"
});
