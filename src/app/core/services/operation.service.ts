import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../helpers/helper';
import { Operation } from '../models/operation.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  constructor(private http: HttpClient) { }

  public getOperationsByPropertyId ( id : number){
    return this.http.get<Operation[]>(`${baseUrl}/property/listOp/${id}`)
  }

  public createOperationWithPropId (id : number, data: Operation) {
    return this.http.post<Operation>(`${baseUrl}/operation/${id}`, data)
  }

  public deleteOperation ( id : number ): Observable <string>{
    return this.http.delete(`${baseUrl}/operation/${id}`, { responseType: 'text' })
  }

}
