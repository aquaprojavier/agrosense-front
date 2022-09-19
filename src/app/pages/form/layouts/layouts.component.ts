import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { MyValidators } from 'src/app/utils/validators';


@Component({
  selector: 'app-layouts',
  templateUrl: './layouts.component.html',
  styleUrls: ['./layouts.component.scss']
})
export class LayoutsComponent implements OnInit {


form: FormGroup;
// bread crumb items
breadCrumbItems: Array<{}>;

constructor(private formBuilder: FormBuilder) {
  this.buildForm();
 }

ngOnInit(): void {
  this.breadCrumbItems = [{ label: 'Forms' }, { label: 'Form Layouts', active: true }];
}

private buildForm(){
  this.form = this.formBuilder.group({
    fullname: this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(10)]],
      lastname: ['', [Validators.required, Validators.maxLength(10)]],
    }),    
    password: ['', [Validators.required, Validators.minLength(5), MyValidators.validPassword]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    color: ['#000000'],
    age: ['12', [Validators.required, Validators.min(18), Validators.max(100)]],
    date: [''],
    category: ['one']
  });
  }

  get nameField() {
  return this.form.get('fullname.name');
}

get lastnameField() {
  return this.form.get('fullname.lastname');
}

  get isNameFieldValid() {
  return this.nameField.touched && this.nameField.valid;
}

  get isNameFieldInvalid() {
  return this.nameField.touched && this.nameField.invalid;
}

get passwordField() {
  return this.form.get('password')
}

  get emailField() {
  return this.form.get('email')
}
  get dateField() {
  return this.form.get('date')
}
  get phoneField() {
  return this.form.get('phone')
}
  get colorField() {
  return this.form.get('color')
}
  get ageField() {
  return this.form.get('age')
}
  get categoryField() {
  return this.form.get('category')
}
  get tagField() {
  return this.form.get('tag')
}

save(event){
  if (this.form.valid){
    console.log(this.form.value)
  }else {
    this.form.markAllAsTouched();
  }
 
}

}
