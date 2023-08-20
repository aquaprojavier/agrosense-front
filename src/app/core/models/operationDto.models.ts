import { Device } from "./device.models";
import { Polygon } from "./polygon.models";

export class OperationDto {
    operationId?: number;
    operationName: string;
    operationArea: number;
    propertyId?: number;
    polygons?: Polygon[];
    devices?: Device[]
}