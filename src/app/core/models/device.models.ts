import { Soil } from "./soil.model";

export class Device {
    devicesId?: number;
    devicesNombre: string;
    devicesCultivo: string;
    devicesSerie: string;
    latitud: number;
    longitud: number;
    // operationId: number;
    conected?: boolean;
    soil?: Soil;
}