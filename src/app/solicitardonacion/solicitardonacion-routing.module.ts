import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SolicitardonacionPage } from './solicitardonacion.page';

const routes: Routes = [
  {
    path: '',
    component: SolicitardonacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SolicitardonacionPageRoutingModule {}
