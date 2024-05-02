import { Injectable } from '@angular/core';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  constructor(private loginService: LoginService) { }

  // Método para verificar si el usuario tiene un rol específico
  public hasRole(role: string): boolean {
    const userRole = this.loginService.getUserRole();
    return userRole === role;
  }
}
