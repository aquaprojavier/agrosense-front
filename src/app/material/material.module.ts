import { NgModule } from '@angular/core';

import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const MaterialComnponents = [MatInputModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatSelectModule,
  MatIconModule,
  MatSnackBarModule]

@NgModule({
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'fill'}}
  ],
  imports: [MaterialComnponents],
  exports: [MaterialComnponents]
})
export class MaterialModule { }
