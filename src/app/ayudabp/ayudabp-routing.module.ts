import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AyudabpPage } from './ayudabp.page';

const routes: Routes = [
  {
    path: '',
    component: AyudabpPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AyudabpPageRoutingModule {}
