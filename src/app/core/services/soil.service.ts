import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../helpers/helper';
import { Soil } from '../models/soil.model';


@Injectable({
  providedIn: 'root'
})
export class SoilService {

  constructor( private http: HttpClient) { }

  public GetSoils() {
    return this.http.get<Soil[]>(`${baseUrl}/soil`)
  }

}
