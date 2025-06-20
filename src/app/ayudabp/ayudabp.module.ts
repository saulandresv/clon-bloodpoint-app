import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AyudabpPageRoutingModule } from './ayudabp-routing.module';

import { AyudabpPage } from './ayudabp.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AyudabpPageRoutingModule
  ],
})
export class AyudabpPageModule {}
