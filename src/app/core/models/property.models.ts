import { Device } from "./device.models";

export class Property {
    propId?: number;
    propNombre: string;
    propUbic: string;
    propDefault: number;
    latitud: number;
    longitud: number;
    geojson: string;
    coordenadas?: [number, number];
    devices?:[Device]
  }