function foobar(callback) {
    callback.callbackMethod("Hello World");
}
function barfoo(callback) {
    callback("Hello World");
}
// first bloated version
class SpecificCallback {
    callbackMethod(text) {
        console.log(text);
    }
}
const c = new SpecificCallback();
foobar(c);
// second less bloated version
foobar({ callbackMethod: s => console.log(s) });
// third least bloated version
barfoo(s => console.log(s));
document.getElementById("egal").addEventListener("onlick", e => console.log(e));
