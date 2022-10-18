import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Data } from '../models/data.models';
import baserUrl from '../helpers/helper';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient) { }

  dataGraf(){  
    return this.http.get<Data[]>(`${baserUrl}/graf/verJson/1`);
  }

}
