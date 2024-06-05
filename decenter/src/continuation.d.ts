export type AsyncContinuation<R> = (context: ContinuationContext) => Promise<R>;
export type Continuation<R> = () => R;
export interface ContinuationContext {
    continue<R>(continuation: Continuation<R>): Promise<R>;
    continueAsync<R>(continuation: AsyncContinuation<R>): Promise<R>;
}
