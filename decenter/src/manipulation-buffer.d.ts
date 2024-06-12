import { session } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
export type ManipulationBufferUpdateListener = (buffer: ManipulationBuffer) => void;
export interface ManipulationBuffer {
    /** True if there is at least one manipulation that can be undone */
    canUndo(): boolean;
    /** True if there is at least one manipulation that can be redone */
    canRedo(): boolean;
    /** Redo the latest manipulation */
    redo(): void;
    /** Undo the latest manipulation */
    undo(): void;
    /** The amount of manipulations in the buffer including all undo/redo manipulations */
    totalCount(): number;
    /** The amount of committable manipulations in the buffer */
    headCount(): number;
    /** The amount of undone manipulations */
    tailCount(): number;
    /** Adds a listener that will be notified whenever the internal state of the buffer changes */
    addBufferUpdateListener(listener: ManipulationBufferUpdateListener): void;
    /** Removes a listener that was previously {@link ManipulationBuffer.addBufferUpdateListener added} */
    removeBufferUpdateListener(listener: ManipulationBufferUpdateListener): void;
    beginCompoundManipulation(): void;
    endCompoundManipulation(): void;
    compoundManipulation<R>(manipulator: () => R): R;
}
interface TrackingFrame {
    record(manipulation: mM.Manipulation): void;
    getManipulations(): mM.Manipulation[];
}
export declare class SessionManipulationBuffer implements ManipulationBuffer, TrackingFrame {
    private readonly session;
    private readonly manipulations;
    private readonly outerFrames;
    private currentFrame;
    private readonly listeners;
    private index;
    private suspendTrackingCount;
    constructor(session: session.ManagedGmSession);
    suspendTracking(): void;
    resumeTracking(): void;
    canRedo(): boolean;
    canUndo(): boolean;
    redo(): void;
    undo(): void;
    clear(): void;
    getCommitManipulations(): mM.Manipulation[];
    private applyManipulationUntracked;
    totalCount(): number;
    headCount(): number;
    tailCount(): number;
    addBufferUpdateListener(listener: ManipulationBufferUpdateListener): void;
    removeBufferUpdateListener(listener: ManipulationBufferUpdateListener): void;
    private onMan;
    record(manipulation: mM.Manipulation): void;
    getManipulations(): mM.Manipulation[];
    private notifyListeners;
    beginCompoundManipulation(): void;
    endCompoundManipulation(): void;
    compoundManipulation<R>(manipulator: () => R): R;
}
export {};
