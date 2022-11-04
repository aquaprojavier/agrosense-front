import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/auth.models';
import baserUrl from '../helpers/helper';


@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  constructor( private http: HttpClient) { }

  public getPropertiesByUser (user : User){
    return this.http.get(`${baserUrl}/graf/verJson/`)
  }

  public getDevicesByPropertyId ( id : number ){
    return this.http.get(`${baserUrl}/property/listDev/${id}`)
  }

  public getPropertyById ( id : any ){
    return this.http.get(`${baserUrl}/property/${id}`)
  }
}
