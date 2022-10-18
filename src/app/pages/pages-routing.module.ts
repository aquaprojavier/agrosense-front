import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DefaultComponent } from './dashboards/default/default.component';
import { ChartsComponent } from './charts/charts.component';
import { LineChartComponent } from './charts/line-chart/line-chart.component';

const routes: Routes = [
  { path: 'dashboard', component: DefaultComponent },
  { path: 'barchart', component: ChartsComponent },
  { path: 'linechart', component: LineChartComponent },
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
  { path: 'dashboards', loadChildren: () => import('./dashboards/dashboards.module').then(m => m.DashboardsModule) },
  { path: 'maps', loadChildren: () => import('./maps/maps.module').then(m => m.MapsModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
