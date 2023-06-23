import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/auth.models';
import baseUrl from '../helpers/helper';
import { Device } from '../models/device.models';


@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  constructor( private http: HttpClient) { }

  public getPropertiesByUser (user : User){
    return this.http.get(`${baseUrl}/graf/verJson/`)
  }

  public getDevicesByPropertyId ( id : number ){
    return this.http.get<Device[]>(`${baseUrl}/property/listDev/${id}`)
  }

  public getPropertyById ( id : any ){
    return this.http.get(`${baseUrl}/property/${id}`)
  }
}
