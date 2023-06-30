import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EditComponent } from './edit/edit.component';
import { LineChartComponent } from './charts/line-chart/line-chart.component';

const routes: Routes = [
  { path: 'edit/:id', component: EditComponent },
  { path: 'chart/:id', component: LineChartComponent },//prueba
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) }//luego sacar el lazyload para optimizar la carga, ya que carga primero, no hace falta lazyload.
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
