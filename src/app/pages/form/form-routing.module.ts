import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutsComponent } from './layouts/layouts.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'layouts',
        pathMatch: 'full'
    },    
    {
        path: 'layouts',
        component: LayoutsComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FormRoutingModule { }
