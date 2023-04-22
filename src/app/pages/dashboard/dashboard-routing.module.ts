import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LeafletComponent } from './leaflet/leaflet.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'leaflet', pathMatch: 'full'
    },
    {
        path: 'leaflet',
        component: LeafletComponent
    },
    {
        path: 'leaflet/:id',
        component: LeafletComponent
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
