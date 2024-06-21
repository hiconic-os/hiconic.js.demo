import { Manipulation } from "../com.braintribe.gm.manipulation-model-2.0~/ensure-manipulation-model.js";
export declare class ManipulationMarshaller {
    private merges;
    marshalToString(manipulations: Manipulation[]): Promise<string>;
    marshalToJson(manipulations: Manipulation[]): Promise<any[]>;
    unmarshalFromString(s: string): Promise<Manipulation[]>;
    unmarshalFromJson(json: any): Promise<Manipulation[]>;
}
