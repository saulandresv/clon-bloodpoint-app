import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SolicitardonacionPageRoutingModule } from './solicitardonacion-routing.module';

import { SolicitardonacionPage } from './solicitardonacion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SolicitardonacionPageRoutingModule
  ],
})
export class SolicitardonacionPageModule {}
