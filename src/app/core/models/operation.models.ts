import { Device } from "./device.models";

export class Operation {
    operationId?: number;
    operationName: string;
    operationArea: number;
    operationGeojson: string
    devices?: Device[]
}