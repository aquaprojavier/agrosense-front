import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { UIModule } from '../../shared/ui/ui.module';
import { FormRoutingModule } from './form-routing.module';

import { LayoutsComponent } from './layouts/layouts.component';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';


@NgModule({
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'fill'}}
  ],
  // tslint:disable-next-line: max-line-length
  declarations: [LayoutsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormRoutingModule,
    UIModule,
    MatInputModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatSelectModule
  
  ]
})
export class FormModule { }
