import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { UIModule } from '../../shared/ui/ui.module';
import { FormRoutingModule } from './form-routing.module';

import { LayoutsComponent } from './layouts/layouts.component';
import { MaterialModule } from '../../material/material.module';
import { FormEditComponent } from './form-edit/form-edit.component';
import { CreateDeviceComponent } from './create-device/create-device.component';

@NgModule({
  // tslint:disable-next-line: max-line-length
  declarations: [LayoutsComponent, FormEditComponent, CreateDeviceComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormRoutingModule,
    UIModule,
    MaterialModule  
  ]
})
export class FormModule { }
