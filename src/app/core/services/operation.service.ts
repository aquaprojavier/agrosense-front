import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../helpers/helper';

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  constructor(private http: HttpClient) { }

  public getOperationsByPropertyId ( id : number ){
    return this.http.get(`${baseUrl}/property/listOp/${id}`)
  }
}
