import { LatLngExpression } from "leaflet";
import { Soil } from "./soil.model";
import { Property } from "./property.models";

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
    conected?: boolean;//poner en funcionamiento esto, para evitar que al borra se pierdan todos los datos.
    soil?: Soil;
    property?: Property
}