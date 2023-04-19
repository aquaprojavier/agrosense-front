import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baserUrl from '../helpers/helper';
import { User } from '../models/auth.models';

@Injectable({ providedIn: 'root' })

export class UserProfileService {
    
    constructor(private http: HttpClient) { }

    // cambiar aca
    getAll() {
        return this.http.get<User[]>(`/api/login`);
    }

    register(user: User) {
        return this.http.post(`${baserUrl}/usuarios`, user);
    }

    getProperties (userId: any){
        return this.http.get(`${baserUrl}/property/list/${userId}`)
    }
    
}
