import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { GrafService } from './services/data.service';


@NgModule({
  declarations: [],
  imports: [ HttpClientModule ],
  providers: [GrafService]
})
export class CoreModule { }
