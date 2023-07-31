import { Device } from "./device.models";
import { Polygon } from "./polygon.models";

export class Operation {
    operationId?: number;
    operationName: string;
    operationArea: number;
    polygons?: Polygon[];
    devices?: Device[]
}