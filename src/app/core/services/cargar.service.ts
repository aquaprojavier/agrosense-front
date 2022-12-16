import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CargarService {

  constructor() { }

  public carga (archives:string[]){
    for ( let archive of archives){
      let script = document.createElement("script");
      script.src= "../../../assets/js/" + archive + ".js";
      let body = document.getElementsByTagName("body")[0];
      body.appendChild(script);
    }
  }
}
