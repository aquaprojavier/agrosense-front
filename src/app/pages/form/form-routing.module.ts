import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormEditComponent } from './form-edit/form-edit.component';
import { LayoutsComponent } from './layouts/layouts.component';
import { CreateDeviceComponent } from './create-device/create-device.component';

const routes: Routes = [
    { path: '', redirectTo: 'layouts', pathMatch: 'full' },
    { path: 'layouts', component: LayoutsComponent },
    { path: 'form-edit/:idProp/:idDev', component: FormEditComponent },
    { path: 'create-device/:idProp', component: CreateDeviceComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FormRoutingModule { }
