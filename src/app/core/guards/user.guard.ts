import { Injectable } from '@angular/core';
import { Router,ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable({ providedIn: 'root'})

export class UserGuard implements CanActivate {

  constructor(
    private router: Router,
    private loginService: LoginService  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) {
    
      if (this.loginService.isLoggedIn() && this.loginService.getUserRole() == 'USER') {
        console.log("entro el userGuard y dejo pasar");
        // logged in so return true
        return true;
    }

    // not logged in so redirect to login page with the return url
    this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url } });
    console.log("no paso el userGuard y redirecciono al login");
    return false;
  }
  
}
