import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../helpers/helper';
import { Operation } from '../models/operation.models';
import { Observable } from 'rxjs';
import { OperationDto } from '../models/operationDto.models';

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  constructor(private http: HttpClient) { }

  public getOperationsByPropertyId ( id : number){
    return this.http.get<Operation[]>(`${baseUrl}/property/listOp/${id}`)
  }

  public createOperation (data: Operation) {
    return this.http.post<Operation>(`${baseUrl}/operation`, data)
  }

  public deleteOperation ( id : number ): Observable <string>{
    return this.http.delete(`${baseUrl}/operation/${id}`, { responseType: 'text' })
  }

  public updateOperation (id: number, data: OperationDto) {
    return this.http.put<Operation>(`${baseUrl}/operation/${id}`, data)
  }
}
