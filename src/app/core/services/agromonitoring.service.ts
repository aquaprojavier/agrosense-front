import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AgromonitoringService {

  private readonly APP_ID = '8dbe5b04b083a07e2c25cd0193c562fc';

  constructor(private http: HttpClient) { }

  // Paso 1: Buscar imágenes de satélite para un polígono
  searchImages(startDate: number, endDate: number, polygonId: string): Observable<any[]> {
    const url = `/agro/1.0/image/search?start=${startDate}&end=${endDate}&polyid=${polygonId}&appid=${this.APP_ID}`;
    return this.http.get<any[]>(url);
  }

  // Paso 2: Obtener imágenes y datos para cada URL proporcionada
  getDataFromUrls(urls: string[]): Observable<any[]> {
    const requests: Observable<any>[] = [];

    urls.forEach(url => {
      const request = this.http.get<any>(`${url}&appid=${this.APP_ID}`);
      requests.push(request);
    });

    // Ejecutar todas las solicitudes concurrentemente
    return forkJoin(requests);
  }

  // Método que recibe el array de objetos y devuelve la URL 'ndvi' del 'type' Sentinel-2
getSentinel2NDVILink(responses: any[]): string | undefined {
  for (const response of responses) {
    if (response.type === 'Sentinel-2' && response.tile && response.tile.ndvi) {
      return response.tile.ndvi;
    }
  }
  return undefined; // Si no se encuentra el enlace ndvi
}
}

