import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificacionPage } from './notificacion.page';

import { NotificacionPageRoutingModule } from './notificacion-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    NotificacionPageRoutingModule
  ],
  declarations: [NotificacionPage]
})
export class NotificacionPageModule {}
