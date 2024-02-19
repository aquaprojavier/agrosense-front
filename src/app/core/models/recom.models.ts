import { Operation } from "./operation.models";

export class Recomendation {
    recomId: number;
    date: Date;
    recom: string;
    operation?: Operation; // Asegúrate de definir también el modelo para Operation si lo necesitas
}