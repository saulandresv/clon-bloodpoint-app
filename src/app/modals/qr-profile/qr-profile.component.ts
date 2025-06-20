import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-profile',
  template: `
    <ion-content class="ion-padding">
      <div class="ovalo ovalotop"></div>
      <div class="ovalo ovalomid"></div>

      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" class="ion-text-center">
            <h1>Escanea mi código QR</h1>
            <div class="qr-container" *ngIf="qrData">
              <qrcode
                [qrdata]="qrData"
                [width]="256"
                [errorCorrectionLevel]="'M'">
              </qrcode>
            </div>
            <ion-button 
              class="return-button" 
              (click)="dismiss()"
              fill="solid"
              color="danger"
              shape="round"
              size="large">
              <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
              Regresar a Perfil
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [`
    .qr-container {
      background: white;
      padding: 20px;
      border-radius: 15px;
      display: inline-block;
      margin: 30px auto;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      position: relative;
      z-index: 1;
    }
    h1 {
      color: #b93636;
      font-size: 2em;
      margin: 40px 0;
      position: relative;
      z-index: 1;
    }
    .ovalo {
      position: fixed;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: rgba(255, 192, 192, 0.2);
      z-index: 0;
    }
    .ovalotop {
      top: -200px;
      right: -200px;
    }
    .ovalomid {
      bottom: -200px;
      left: -200px;
    }
    ion-content {
      --background: #ffffff;
    }
    .return-button {
      margin-top: 40px;
      --background: #dd5757;
      --color: #ffffff !important;
      --border-radius: 25px;
      --padding-start: 30px;
      --padding-end: 30px;
      --padding-top: 20px;
      --padding-bottom: 20px;
      font-size: 16px;
      font-weight: 500;
      text-transform: none;
      color: #ffffff;
    }

    ion-button::part(native) {
      color: #ffffff;
    }
    
    ion-button ion-icon {
      margin-right: 8px;
      font-size: 20px;
    }
  `],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    QRCodeComponent
  ]
})
export class QrProfileComponent implements OnInit {
  qrData: string = '';

  constructor(
    private modalCtrl: ModalController,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    this.apiService.getPerfilUsuario().subscribe({
      next: (res) => {
        // Solo los campos esenciales para el registro de donación
        const userData = {
          rut: res.data.rut,
          nombre_completo: res.data.nombre_completo,
          sexo: res.data.sexo,
          direccion: res.data.direccion,
          comuna: res.data.comuna,
          nacionalidad: res.data.nacionalidad,
          tipo_sangre: res.data.tipo_sangre
        };
        
        this.qrData = JSON.stringify(userData);
      },
      error: (err) => {
        console.error('Error al cargar perfil para QR:', err);
      }
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}