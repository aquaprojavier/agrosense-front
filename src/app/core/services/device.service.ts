import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import baseUrl from '../helpers/helper';
import { Device } from '../models/device.models';
import { DeviceEdit } from '../models/deviceEdit.models';
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
  
  
  public putDevicesById(id: number, data: Device): Observable<Device> {
    return this.http.put<Device>(`${baseUrl}/device/${id}`, data);
  }

  public getDevicesById (id : number ) {
    return this.http.get(`${baseUrl}/device/${id}`)
  }

  public createDevice ({ data }: { data: Device; }) {
    return this.http.post<Device>(`${baseUrl}/device`, data)
  }

  public getSoilByDevicesId (id : number ) {
    return this.http.get<Soil>(`${baseUrl}/device/soil/${id}`)
  }

  public putDevicesEditById(idDev: number, idPol: number, data: DeviceEdit): Observable<DeviceEdit> {
    return this.http.put<DeviceEdit>(`${baseUrl}/device/editDevAndPol/${idDev}/${idPol}`, data);
  }
  
  public getPoligonByDeviceId(id: number){
    return this.http.get(`${baseUrl}/device/poligon/${id}`)
  }
}
