import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-layouts',
  templateUrl: './layouts.component.html',
  styleUrls: ['./layouts.component.scss']
})
export class LayoutsComponent implements OnInit {

  nameField = new FormControl('', Validators.required);
  emailField = new FormControl('');
  phoneField = new FormControl('');
  colorField = new FormControl('#000000');
  ageField = new FormControl('12');
  dateField = new FormControl('');
  categoryField = new FormControl('cat 2');
  tagsField = new FormControl('');

  // bread crumb items
  breadCrumbItems: Array<{}>;

  constructor() { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Forms' }, { label: 'Form Layouts', active: true }];
    this.nameField.valueChanges.subscribe(value => {console.log(value)});
  }

  getNameValue(){
    console.log(this.nameField.value);
  }

}
