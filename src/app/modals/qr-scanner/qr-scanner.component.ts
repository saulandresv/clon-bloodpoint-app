import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { BarcodeScanner, BarcodeFormat, Barcode } from '@capacitor-mlkit/barcode-scanning';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  constructor(
    private modalCtrl: ModalController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.startScanning();
  }

  private async startScanning() {
    try {
      // Verificar y solicitar permisos
      const permissions = await BarcodeScanner.checkPermissions();
      if (permissions.camera !== 'granted') {
        const requestResult = await BarcodeScanner.requestPermissions();
        if (requestResult.camera !== 'granted') {
          await this.showToast('Se requiere permiso de cámara para escanear códigos QR');
          await this.modalCtrl.dismiss();
          return;
        }
      }

      // Iniciar el scanner
      const { barcodes } = await BarcodeScanner.scan();

      if (barcodes.length > 0) {
        const result = barcodes[0].rawValue;
        console.log('QR escaneado:', result);
        await this.modalCtrl.dismiss(result);
      } else {
        console.log('No se detectaron códigos QR');
        await this.modalCtrl.dismiss();
      }
    } catch (error) {
      console.error('Error al escanear:', error);
      let message = 'Error al escanear código QR';
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          message = 'Se requiere permiso de cámara';
        } else if (error.message.includes('cancelled')) {
          message = 'Escaneo cancelado';
        }
      }
      
      await this.showToast(message);
      await this.modalCtrl.dismiss();
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }

  async ngOnDestroy() {
    try {
      // Detener el scanner si está activo
      await BarcodeScanner.stopScan();
    } catch (error) {
      console.log('Scanner ya estaba detenido');
    }
  }

  async dismiss() {
    try {
      await BarcodeScanner.stopScan();
    } catch (error) {
      console.log('Scanner ya estaba detenido');
    }
    await this.modalCtrl.dismiss();
  }
}
