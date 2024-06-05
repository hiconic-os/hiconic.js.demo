class ContinuationContextImpl {
    constructor() {
        this.asyncThreshold = 20;
        this.lastTask = new ContinuationQueueNode();
        this.messageChannel = new MessageChannel();
        this.messageChannel.port1.onmessage = () => this.work();
    }
    continue(continuation) {
        return new Promise((resolve, reject) => {
            queueMicrotask(() => {
                try {
                    resolve(continuation());
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    continueAsync(continuation) {
        return new Promise((resolve, reject) => {
            queueMicrotask(() => {
                try {
                    continuation(this).then(resolve).catch(reject);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    enqueue(task) {
        this.lastTask.next = task;
        if (this.nextTask == null) {
            this.nextTask = task;
            this.schedule();
        }
    }
    schedule() {
        setTimeout(() => this.work(), 0);
    }
    work() {
        let startTime = Date.now();
        let task = this.nextTask;
        const threshold = this.asyncThreshold;
        while (task != null) {
            task.execute();
            task = this.nextTask = task.next;
            const curTime = Date.now();
            if ((curTime - startTime) > threshold) {
                if (task != null)
                    this.schedule();
                break;
            }
        }
    }
}
class ContinuationQueueNode {
}
class ContinuationTask {
    execute() {
    }
}
export {};
