import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { UIModule } from '../../shared/ui/ui.module';
import { FormRoutingModule } from './form-routing.module';

import { LayoutsComponent } from './layouts/layouts.component';
import { MaterialModule } from '../../material/material.module';
import { EditDeviceComponent } from './edit-device/edit-device.component';
import { CreateDeviceComponent } from './create-device/create-device.component';
import { CreateOperationComponent } from './create-operation/create-operation.component';
import { EditOperationComponent } from './edit-operation/edit-operation.component';

@NgModule({
  // tslint:disable-next-line: max-line-length
  declarations: [LayoutsComponent, EditDeviceComponent, CreateDeviceComponent, CreateOperationComponent, EditOperationComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormRoutingModule,
    UIModule,
    MaterialModule  
  ]
})
export class FormModule { }
