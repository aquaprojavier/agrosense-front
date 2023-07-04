import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EditDeviceComponent } from './edit-device/edit-device.component';
import { LayoutsComponent } from './layouts/layouts.component';
import { CreateDeviceComponent } from './create-device/create-device.component';
import { CreateOperationComponent } from './create-operation/create-operation.component';
import { EditOperationComponent } from './edit-operation/edit-operation.component';

const routes: Routes = [
    { path: '', redirectTo: 'layouts', pathMatch: 'full' },
    { path: 'layouts', component: LayoutsComponent },
    { path: 'edit-device/:idProp/:idDev', component: EditDeviceComponent },
    { path: 'create-operation/:idProp', component: CreateOperationComponent},
    { path: 'edit-operation/:idProp', component: EditOperationComponent},
    { path: 'create-device/:idProp', component: CreateDeviceComponent},
    { path: 'edit-device/:idProp', component: EditDeviceComponent}

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FormRoutingModule { }
