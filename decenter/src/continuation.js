export class Continuation {
    constructor() {
        this.asyncThreshold = 20;
        this.lastNode = new ContinuationQueueNode();
        this.messageChannel = new MessageChannel();
        this.messageChannel.port1.onmessage = () => this.work();
        this.initPromise();
    }
    initPromise() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    async wait() {
        await this.promise;
        this.initPromise();
    }
    forEachOf(iterable, consumer) {
        this.enqueue(new ContinuationTaskNode(iterable[Symbol.iterator](), consumer));
    }
    forEachOfIterator(iterator, consumer) {
        this.enqueue(new ContinuationTaskNode(iterator, consumer));
    }
    forEachOfIterable(iterable, consumer) {
        this.forEachOf(iterable.iterable(), consumer);
    }
    enqueue(task) {
        this.lastNode.next = task;
        this.lastNode = task;
        if (this.nextNode == null) {
            this.nextNode = task;
            this.schedule();
        }
    }
    schedule() {
        this.messageChannel.port2.postMessage(null);
    }
    work() {
        try {
            let startTime = Date.now();
            let node = this.nextNode;
            const threshold = this.asyncThreshold;
            while (node != null) {
                const { it, consumer } = node;
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
}
class ContinuationTaskNode extends ContinuationQueueNode {
    constructor(it, consumer) {
        super();
        this.it = it;
        this.consumer = consumer;
    }
}
