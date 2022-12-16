import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DataService } from './services/data.service';
import { CargarService } from './services/cargar.service';


@NgModule({
  declarations: [],
  imports: [ HttpClientModule ],
  providers: [DataService, CargarService]
})
export class CoreModule { }
