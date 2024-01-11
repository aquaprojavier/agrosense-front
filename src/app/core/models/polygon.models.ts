import { Device } from "./device.models";

export class Polygon {
    polygonId?: number;
    name?: string;
    area?: number;
    agromonitoringId?: string;
    geojson: string;
    devices?: Device[];
}