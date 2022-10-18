import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthenticationService } from '../services/auth.service';
import { LoginService } from '../services/login.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authenticationService: AuthenticationService, private loginService: LoginService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let authReq = req;
        const token = this.loginService.getToken();
        console.log("entro al interceptor");
        
        if(token != null){
          console.log("paso por interceptor y coloco bearer + token: " + token);
          authReq = authReq.clone({
            setHeaders : {Authorization: `Bearer ${token}` }
          })
        }
        return next.handle(authReq);
      } 
}
export const authInterceptorProviders = [
    {
      provide : HTTP_INTERCEPTORS,
      useClass : JwtInterceptor,
      multi : true
    }
  ]
