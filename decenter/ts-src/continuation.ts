import { lang } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";

export type DeferredFunction = (this: Continuation, ...args: any[]) => void;
export type ContinuationConsumer<E, C> = (this: Continuation, el: E, context: C) => void;

export abstract class Continuation {
    readonly asyncThreshold = 20;

    private lastNode: ContinuationQueueNode = new ContinuationQueueNode();
    private nextNode: ContinuationTaskNode<any, any>;
    
    private readonly messageChannel = new MessageChannel();

    private resolve: () => void;
    private reject: (e: any) => void;
    
    private promise: Promise<void>;

    constructor() {
        this.messageChannel.port1.onmessage = () => this.work();
        this.initPromise();
    }

    private initPromise() {
        this.promise = new Promise<void>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    protected async wait(): Promise<void> {
        await this.promise;
        this.initPromise();
    }

    protected forEachOf<E>(iterable: Iterable<E>, consumer: (e: E) => void): void {
        this.enqueue(new ContinuationTaskNode(iterable[Symbol.iterator](), consumer));
    }

    protected forEachOfIterator<E>(iterator: Iterator<E>, consumer: (e: E) => void): void {
        this.enqueue(new ContinuationTaskNode(iterator, consumer));
    }

    protected forEachOfIterable<E>(iterable: lang.Iterable<E>, consumer: (e: E) => void): void {
        this.forEachOf(iterable.iterable(), consumer);
    }

    private enqueue(task: ContinuationTaskNode<any, any>): void {
        this.lastNode.next = task;
        this.lastNode = task;

        if (this.nextNode == null) {
            this.nextNode = task;
            this.schedule();
        }
    }

    private schedule(): void {
        this.messageChannel.port2.postMessage(null);
    }

    private work(): void {
        try {
            let startTime = Date.now();

            let node = this.nextNode;
            const threshold = this.asyncThreshold;

            while (node != null) {
                const {it, consumer} = node;

                while (true) {
                    const res = it.next();

                    if (res.done)
                        break;

                    consumer(res.value);

                    const curTime = Date.now();

                    if ((curTime - startTime) > threshold) {
                        this.schedule();
                        return;
                    }
                }

                node = this.nextNode = node.next;
            }

            // the whole process has ended
            this.resolve();
        }
        catch (e) {
            this.reject(e);
        }
    }
}

class ContinuationQueueNode {
    next: ContinuationTaskNode<any, any>;
}

class ContinuationTaskNode<E, C> extends ContinuationQueueNode {
    readonly it: Iterator<E>;
    readonly consumer: (e: E) => void;
    
    constructor(it: Iterator<E>, consumer: (e: E) => void) {
        super();
        this.it = it;
        this.consumer = consumer;
    }
}


