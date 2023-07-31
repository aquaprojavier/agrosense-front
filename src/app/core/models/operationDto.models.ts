import { Device } from "./device.models";
import { Polygon } from "./polygon.models";

export class OperationDto {
    operationId?: number;
    operationName: string;
    operationArea: number;
    propId: number;
    polygons?: Polygon[];
    devices?: Device[]
}