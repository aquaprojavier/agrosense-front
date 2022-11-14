import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Data } from '../models/data.models';
import baserUrl from '../helpers/helper';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient) { }

  public dataGraf(deviceId: number){  
    return this.http.get<Data[]>(`${baserUrl}/graf/verJson/${deviceId}`);
  }

}