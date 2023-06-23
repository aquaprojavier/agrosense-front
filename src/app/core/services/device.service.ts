import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../helpers/helper';
import { Device } from '../models/device.models';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private http: HttpClient) { }

  public GetDevices () {
    return this.http.get(`${baseUrl}/device`)
  }

  public GetDevicesById (id : number ) {
    return this.http.get(`${baseUrl}/device/${id}`)
  }

  public PutDevicesById(id: number, data: Device) {
    return this.http.put(`${baseUrl}/device/${id}`, data);
  }

  public GetPoligonByDeviceId(id: number){
    return this.http.get(`${baseUrl}/device/poligon/${id}`)
  }

}
