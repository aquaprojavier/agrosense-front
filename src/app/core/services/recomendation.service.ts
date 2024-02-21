import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../helpers/helper';
import { Recomendation } from '../models/recom.models';


@Injectable({
  providedIn: 'root'
})
export class RecomendationService {

  constructor(private http: HttpClient) { }

  public getRecomendationByProp ( propId : number ){
    return this.http.get<Recomendation[]>(`${baseUrl}/getRecomendationByProp/${propId}`)
  }
}
