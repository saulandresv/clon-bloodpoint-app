import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IndexPageRoutingModule } from './index-routing.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    IndexPageRoutingModule
  ],
  // Remove IndexPage from declarations since it's standalone
  declarations: []
})
export class IndexPageModule { }
