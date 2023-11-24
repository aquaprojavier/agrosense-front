import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Data } from '../models/data.models';
import baseUrl from '../helpers/helper';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient) { }

  public showDataByIdAndLastDays(deviceId: number, days: number){  
    return this.http.get<Data[]>(`${baseUrl}/data/showByLastDays/${deviceId}/${days}`);
  }

  public fullDataByDeviceId(deviceId: number){  
    return this.http.get<Data[]>(`${baseUrl}/data/show/${deviceId}`);
  }

  public getSerialNumber(serialId: string){  
    return this.http.get<string[]>(`${baseUrl}/data/serialNumber/${serialId}`);
  }

  //este metodo da error
  public lastDataByDeviceId(deviceId: number){  
    return this.http.get<Data>(`${baseUrl}/device/lastData/${deviceId}`);
  }

  public lastDatasByDeviceId(deviceId: number, datas: number){  
    return this.http.get<Data[]>(`${baseUrl}/data/lastDatas/${deviceId}/${datas}`);
  }

}
