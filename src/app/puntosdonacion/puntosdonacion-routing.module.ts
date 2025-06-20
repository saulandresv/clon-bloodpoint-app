import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntosdonacionPage } from './puntosdonacion.page';

const routes: Routes = [
  {
    path: '',
    component: PuntosdonacionPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PuntosdonacionPageRoutingModule {}
