import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetalleshPageRoutingModule } from './detallesh-routing.module';

import { DetalleshPage } from './detallesh.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetalleshPageRoutingModule
  ],
})
export class DetalleshPageModule {}
