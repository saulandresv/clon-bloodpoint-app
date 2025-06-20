import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetalleshPage } from './detallesh.page';

const routes: Routes = [
  {
    path: '',
    component: DetalleshPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetalleshPageRoutingModule {}
