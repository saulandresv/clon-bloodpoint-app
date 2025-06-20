import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PuntosdonacionPage } from './puntosdonacion.page';

import { PuntosdonacionPageRoutingModule } from './puntosdonacion-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    PuntosdonacionPageRoutingModule
  ],
})
export class PuntosdonacionPageModule {}
