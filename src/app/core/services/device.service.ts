import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baserUrl from '../helpers/helper';
import { Device } from '../models/device.models';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private http: HttpClient) { }

  public GetDevices () {
    return this.http.get(`${baserUrl}/device`)
  }

  public GetDevicesById (id : number ) {
    return this.http.get(`${baserUrl}/device/${id}`)
  }

}
