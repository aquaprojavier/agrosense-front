import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgmCoreModule } from '@agm/core';

import { UIModule } from '../../shared/ui/ui.module';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { LeafletComponent } from './leaflet/leaflet.component';

@NgModule({
  declarations: [LeafletComponent],
  imports: [
    CommonModule,
    RouterModule,
    DashboardRoutingModule,
    UIModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAbvyBxmMbFhrzP9Z8moyYr6dCr-pzjhBE'
    }),
  ]
})
export class DashboardModule { }
