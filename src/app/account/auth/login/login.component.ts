import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';

import { LoginService } from '../../../core/services/login.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

/**
 * Login component
 */
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  submitted = false;
  error = '';
  returnUrl: string;

  // set the currenr year
  year: number = new Date().getFullYear();

  // tslint:disable-next-line: max-line-length
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router,
     private loginService:LoginService, private snack: MatSnackBar) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['usuario', [Validators.required]],
      password: ['12345', [Validators.required]],
    });
     // reset login status
    // this.authenticationService.logout();
    // get return url from route parameters or default to '/'
    // tslint:disable-next-line: no-string-literal
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    } else {
        this.loginService.generateToken(this.loginForm.value).subscribe(
          (data:any) => {
            console.log(data);
            this.loginService.loginUser(data.token);
            this.loginService.getCurrentUser().subscribe((user:any) => {
              this.loginService.setUser(user);
              console.log(user);
    
              if(this.loginService.getUserRole() == 'ADMIN'){
                this.router.navigate(['admin']);
                this.loginService.loginStatusSubjec.next(true); }
              else if(this.loginService.getUserRole() == 'USER'){
                this.router.navigate(['user/dashboard']);
                this.loginService.loginStatusSubjec.next(true);
              }
              else{
                this.loginService.logout();
              }
            })
          }, error => {
            console.log(error);
             this.snack.open('Detalles inválidos , vuelva a intentar !!','Aceptar',{
              duration:3000
            })
          }
        )
    }
  }
}
