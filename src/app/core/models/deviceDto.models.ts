import { Soil } from "./soil.model";

export class DeviceDto {
    devicesId?: number;
    devicesNombre: string;
    devicesType: string;
    devicesCultivo?: string;
    devicesSerie: string;
    latitud: number;
    longitud: number;
    operationId?: number;
    propertyId: number;
    soil?: Soil;
    koef1?: number;
    koef2?: number;
  }
  