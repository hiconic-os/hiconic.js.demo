import { lang } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
export declare type DeferredFunction = (this: Continuation, ...args: any[]) => void;
export declare type ContinuationConsumer<E, C> = (this: Continuation, el: E, context: C) => void;
export declare abstract class Continuation {
    readonly asyncThreshold = 20;
    private lastNode;
    private nextNode;
    private readonly messageChannel;
    private resolve;
    private reject;
    private promise;
    constructor();
    private initPromise;
    protected wait(): Promise<void>;
    protected forEachOf<E>(iterable: Iterable<E>, consumer: (e: E) => void): void;
    protected forEachOfIterator<E>(iterator: Iterator<E>, consumer: (e: E) => void): void;
    protected forEachOfIterable<E>(iterable: lang.Iterable<E>, consumer: (e: E) => void): void;
    private enqueue;
    private schedule;
    private work;
}
