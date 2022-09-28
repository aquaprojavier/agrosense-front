import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import Swal from 'sweetalert2';

import { first } from 'rxjs/operators';
import { UserProfileService } from '../../../core/services/user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  signupForm: FormGroup;
  submitted = false;
  error = '';
  successmsg = false;

  // set the currenr year
  year: number = new Date().getFullYear();

  // tslint:disable-next-line: max-line-length
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router, private userService: UserProfileService) { }

  ngOnInit() {
    this.signupForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    },);
  }

  // convenience getter for easy access to form fields
  get f() { return this.signupForm.controls; }

  /**
   * On submit form
   */
  onSubmit() {
    this.submitted = true;
    //para ver los valores
    console.log(this.signupForm.value);
    // stop here if form is invalid
    if (this.signupForm.invalid) {
      return;
    } else {
      console.log(this.signupForm.value);
      this.userService.register(this.signupForm.value)
        .subscribe(
          (data) => {
            this.router.navigate(['/account/login']);
            Swal.fire('Usuario guardado','Usuario registrado con exito en el sistema','success');
            console.log(data);

            // this.successmsg = true;
            // if (this.successmsg) {
            //   this.router.navigate(['/account/login']);
            // }
          },
          error => {
            this.error = error ? error : '';
          });
    }
  }
}
