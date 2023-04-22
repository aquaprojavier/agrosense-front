import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Data } from '../models/data.models';
import baserUrl from '../helpers/helper';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient) { }

  public fullDataByDeviceId(deviceId: number){  
    return this.http.get<Data[]>(`${baserUrl}/data/verJson/${deviceId}`);
  }

  public lastDataHumByDeviceId(deviceId: number){  
    return this.http.get<any>(`${baserUrl}/device/lastDataHum/${deviceId}`);
  }

  public lastDataByDeviceId(deviceId: number){  
    return this.http.get<any>(`${baserUrl}/device/lastData/${deviceId}`);
  }

}
