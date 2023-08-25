import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import baseUrl from '../helpers/helper';
import { Device } from '../models/device.models';
import { DeviceDto } from '../models/deviceDto.models';
import { Observable } from 'rxjs';
import { Soil } from '../models/soil.model';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private http: HttpClient) { }

  public getDevices () {
    return this.http.get(`${baseUrl}/device`)
  }

  deleteDevice(id: number): Observable<string> {
    return this.http.delete(`${baseUrl}/device/${id}`, { responseType: 'text' });
  }
  
  public editDevice(id: number, data: DeviceDto) {
    return this.http.put<Device>(`${baseUrl}/device/${id}`, data);
  }

  public getDevicesById (id : number ) {
    return this.http.get<Device>(`${baseUrl}/device/${id}`)
  }

  public createDevice ({ data }: { data: DeviceDto; }) {
    return this.http.post<Device>(`${baseUrl}/device`, data)
  }

  public getSoilByDevicesId (id : number ) {
    return this.http.get<Soil>(`${baseUrl}/device/soil/${id}`)
  }
  
  public getPoligonByDeviceId(id: number){
    return this.http.get(`${baseUrl}/device/poligon/${id}`)
  }
}
