import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBarModule } from '@angular/material/snack-bar';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatNativeDateModule} from '@angular/material/core';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { ReactiveFormsModule } from '@angular/forms';


const MaterialComnponents = [
  MatButtonToggleModule,
  MatNativeDateModule,
  MatButtonModule,
  MatInputModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatSelectModule,
  MatIconModule,
  MatSnackBarModule,
  MatAutocompleteModule,
  ReactiveFormsModule]

@NgModule({
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'fill'}}
  ],
  imports: [MaterialComnponents],
  exports: [MaterialComnponents]
})
export class MaterialModule { }
