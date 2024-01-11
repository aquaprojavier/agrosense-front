import { Crop } from "./crop.models";
import { Device } from "./device.models";
import { Irrigation } from "./irrigation.models";
import { Polygon } from "./polygon.models";
import { Soil } from "./soil.model";

export class Operation {
    operationId?: number;
    operationName: string;
    operationArea?: number;
    propertyId: number;
    plantingYear?: number;
    betweenPlant?: number;
    betweenRow?: number;
    crop?: Crop;
    polygons?: Polygon[];
    irrigation?: Irrigation;
    soil?: Soil;
}