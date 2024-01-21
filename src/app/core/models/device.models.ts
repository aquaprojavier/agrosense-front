import { LatLngExpression } from "leaflet";
import { Soil } from "./soil.model";

export class Device {
    devicesId?: number;
    devicesNombre: string;
    devicesType?: string;
    devicesCultivo: string;
    devicesSerie: string;
    latitud: number;
    longitud: number;
    coordenadas?: LatLngExpression;
    polygonId?: number;
    conected?: boolean;
    soil?: Soil;
}