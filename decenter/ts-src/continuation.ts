


export type AsyncContinuation<R> = (context: ContinuationContext) => Promise<R>;
export type Continuation<R> = () => R;


export interface ContinuationContext {
    continue<R>(continuation: Continuation<R>): Promise<R>
    continueAsync<R>(continuation: AsyncContinuation<R>): Promise<R>
}


class ContinuationContextImpl implements ContinuationContext {
    readonly asyncThreshold = 20;

    lastTask: ContinuationQueueNode = new ContinuationQueueNode();
    nextTask: ContinuationTask;

    readonly messageChannel = new MessageChannel();

    constructor() {
        this.messageChannel.port1.onmessage = () => this.work();
    }

    continue<R>(continuation: Continuation<R>): Promise<R> {
        return new Promise<R>((resolve, reject) => {
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

    continueAsync<R>(continuation: AsyncContinuation<R>): Promise<R> {
        return new Promise<R>((resolve, reject) => {
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

    private enqueue(task: ContinuationTask): void {
        this.lastTask.next = task;

        if (this.nextTask == null) {
            this.nextTask = task;
            this.schedule();            
        }
    }

    private schedule(): void {
        setTimeout(() => this.work(), 0);
    }

    private work(): void {
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
    next: ContinuationTask;
}

class ContinuationTask {
    continuation: Continuation<any>;
    promise: Promise<any>;
    next: ContinuationTask;

    execute(): void {

    }
}


