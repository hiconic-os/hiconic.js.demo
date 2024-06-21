import { session } from "../tribefire.js.tf-js-api-3.0~/tf-js-api.js";
import * as mM from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
class NestedTrackingFrame {
    constructor() {
        this.manipulations = new Array();
    }
    record(manipulation) {
        this.manipulations.push(manipulation);
    }
    getManipulations() {
        return this.manipulations;
    }
}
export class SessionManipulationBuffer {
    constructor(session) {
        this.manipulations = new Array();
        this.outerFrames = new Array();
        this.currentFrame = this;
        this.listeners = new Array();
        this.suspendTrackingCount = 0;
        this.session = session;
        this.session.listeners().add({ onMan: m => this.onMan(m) });
    }
    suspendTracking() {
        this.suspendTrackingCount++;
    }
    resumeTracking() {
        this.suspendTrackingCount--;
    }
    canRedo() {
        return this.tailCount() > 0;
    }
    canUndo() {
        return this.headCount() > 0;
    }
    redo() {
        if (!this.canRedo())
            return;
        const m = this.manipulations[this.index++];
        this.applyManipulationUntracked(m);
        this.notifyListeners();
    }
    undo() {
        if (!this.canUndo())
            return;
        const m = this.manipulations[--this.index];
        this.applyManipulationUntracked(m.inverseManipulation);
        this.notifyListeners();
    }
    clear() {
        this.manipulations.length = 0;
        this.index = 0;
        this.notifyListeners();
    }
    getCommitManipulations() {
        return this.manipulations.slice(0, this.headCount());
    }
    applyManipulationUntracked(m) {
        this.suspendTracking();
        try {
            this.session.manipulate().mode(session.ManipulationMode.LOCAL).apply(m);
        }
        finally {
            this.resumeTracking();
        }
    }
    totalCount() {
        return this.manipulations.length;
    }
    headCount() {
        return this.index;
    }
    tailCount() {
        return this.totalCount() - this.headCount();
    }
    addBufferUpdateListener(listener) {
        this.listeners.push(listener);
    }
    removeBufferUpdateListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1)
            this.listeners.splice(index, 1);
    }
    onMan(manipulation) {
        if (this.suspendTrackingCount > 0)
            return;
        this.currentFrame.record(manipulation);
    }
    record(manipulation) {
        this.manipulations.length = this.index++;
        this.manipulations.push(manipulation);
        this.notifyListeners();
    }
    getManipulations() {
        return this.manipulations.slice(0, this.index);
    }
    notifyListeners() {
        for (const l of this.listeners) {
            l(this);
        }
    }
    beginCompoundManipulation() {
        const frame = new NestedTrackingFrame();
        this.outerFrames.push(this.currentFrame);
        this.currentFrame = frame;
    }
    endCompoundManipulation() {
        const frame = this.outerFrames.pop();
        const cM = mM.CompoundManipulation.create();
        const iCM = mM.CompoundManipulation.create();
        cM.inverseManipulation = iCM;
        const manis = cM.compoundManipulationList;
        const inverseManis = iCM.compoundManipulationList;
        const endingFrame = this.currentFrame;
        for (const m of endingFrame.getManipulations()) {
            manis.push(m);
            inverseManis.push(m.inverseManipulation);
        }
        frame.record(cM);
        this.currentFrame = frame;
    }
    compoundManipulation(manipulator) {
        this.beginCompoundManipulation();
        try {
            return manipulator();
        }
        finally {
            this.endCompoundManipulation();
        }
    }
}
