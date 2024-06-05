interface SomeCallback {
    callbackMethod(text: string): void;
}
declare function foobar(callback: SomeCallback): void;
type FunctionalCallback = (text: string) => void;
declare function barfoo(callback: FunctionalCallback): void;
declare class SpecificCallback implements SomeCallback {
    callbackMethod(text: string): void;
}
declare const c: SpecificCallback;
