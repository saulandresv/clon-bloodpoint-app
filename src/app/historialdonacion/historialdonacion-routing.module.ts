import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialdonacionPage } from './historialdonacion.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialdonacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialdonacionPageRoutingModule {}
