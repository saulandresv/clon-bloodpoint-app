import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LogrosPageRoutingModule } from './logros-routing.module';
import { LogrosPage } from './logros.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    LogrosPageRoutingModule,
  ],
})
export class LogrosPageModule {}
