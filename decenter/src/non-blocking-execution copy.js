export function executeNonBlocking(generator) {
    const execution = new NoneBlockingExecution(generator);
    return execution.promise;
}
class NoneBlockingExecution {
    constructor(generator) {
        this.asyncThreshold = 50;
        this.messageChannel = new MessageChannel();
        this.generator = generator;
        this.messageChannel.port1.onmessage = () => this.work();
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.schedule();
    }
    schedule() {
        this.messageChannel.port2.postMessage(null);
    }
    work() {
        let startTime = Date.now();
        let threshold = this.asyncThreshold;
        while (true) {
            try {
                const result = this.generator.next();
                if (result.done) {
                    this.resolve(result.value);
                    return;
                }
            }
            catch (e) {
                this.reject(e);
                return;
            }
            const curTime = Date.now();
            if ((curTime - startTime) > threshold) {
                this.schedule();
                return;
            }
        }
    }
}
