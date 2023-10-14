import { Device } from "./device.models";
import { Polygon } from "./polygon.models";
import { Irrigation } from './irrigation.models';
import { Crop } from './crop.models';

export class OperationDto {
    operationId?: number;
    operationName: string;
    operationArea?: number;
    propertyId?: number;
    polygons?: Polygon[];
    devices?: Device[]
    irrigation?: Irrigation;
    crop?: Crop
}