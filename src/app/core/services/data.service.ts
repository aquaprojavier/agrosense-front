import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Data } from '../models/data.models';
import baseUrl from '../helpers/helper';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient) { }

  public fullDataByDeviceId(deviceId: number){  
    return this.http.get<Data[]>(`${baseUrl}/data/verJson/${deviceId}`);
  }

  public getSerialNumber(serialId: string){  
    return this.http.get<string[]>(`${baseUrl}/data/serialNumber/${serialId}`);
  }

  //este metodo da error
  public lastDataByDeviceId(deviceId: number){  
    return this.http.get<Data>(`${baseUrl}/device/lastData/${deviceId}`);
  }

}
