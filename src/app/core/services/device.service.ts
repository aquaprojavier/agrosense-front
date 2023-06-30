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

  public GetDevices () {
    return this.http.get(`${baseUrl}/device`)
  }
  
  public PutDevicesById(id: number, data: Device): Observable<Device> {
    return this.http.put<Device>(`${baseUrl}/device/${id}`, data);
  }

  public GetDevicesById (id : number ) {
    return this.http.get(`${baseUrl}/device/${id}`)
  }

  public CreateDeviceAndPol(idPol: number, data: DeviceEdit) {
    return this.http.post<Device>(`${baseUrl}/device/createDevAndPol/${idPol}`, data);
  }

  public CreateDevice (data: Device) {
    return this.http.post<Device>(`${baseUrl}/device`, data)
  }

  public GetSoilByDevicesId (id : number ) {
    return this.http.get<Soil>(`${baseUrl}/device/soil/${id}`)
  }

  public PutDevicesEditById(idDev: number, idPol: number, data: DeviceEdit): Observable<DeviceEdit> {
    return this.http.put<DeviceEdit>(`${baseUrl}/device/editDevAndPol/${idDev}/${idPol}`, data);
  }
  
  public GetPoligonByDeviceId(id: number){
    return this.http.get(`${baseUrl}/device/poligon/${id}`)
  }
}
