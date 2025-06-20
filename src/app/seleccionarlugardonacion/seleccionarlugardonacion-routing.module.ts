import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeleccionarlugardonacionPage } from './seleccionarlugardonacion.page';

const routes: Routes = [
  {
    path: '',
    component: SeleccionarlugardonacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SeleccionarlugardonacionPageRoutingModule {} 