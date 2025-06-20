import { Component, OnInit } from '@angular/core';
import { IonHeader } from "@ionic/angular/standalone";
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { QrProfileComponent } from '../modals/qr-profile/qr-profile.component';
import { QrScannerComponent } from '../modals/qr-scanner/qr-scanner.component';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule]
})
export class PerfilPage implements OnInit {
  private debugMode = true; // Cambiar a false para deshabilitar debug

  constructor(
    private router: Router, 
    private toastController: ToastController,
    private modalCtrl: ModalController,
    private apiService: ApiService
  ) {}

  ngOnInit() {
  }

  async cerrarSesion() {
    // Eliminar token y datos de usuario del localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('tipoUsuario');
    
    // Mostrar mensaje de éxito
    const toast = await this.toastController.create({
      message: 'Sesión cerrada correctamente.',
      duration: 2000,
      color: 'success',
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();

    // Redirigir al login
    this.router.navigate(['/login']);
  }

  async mostrarQR() {
    const modal = await this.modalCtrl.create({
      component: QrProfileComponent,
      cssClass: 'qr-modal'
    });
    return await modal.present();
  }

  async escanearQR() {
    const modal = await this.modalCtrl.create({
      component: QrScannerComponent,
      cssClass: 'scanner-modal',
      backdropDismiss: false
    });
    
    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data) {
      await this.debugToast(`QR recibido: ${data.substring(0, 50)}...`);
      
      try {
        const scannedData = JSON.parse(data);
        await this.debugToast(`QR parseado: ${scannedData.rut || 'Sin RUT'}`);
        
        // Verificar que tenemos el lugar seleccionado
        const lugarSeleccionado = localStorage.getItem('lugarDonacionSeleccionado');
        
        if (!lugarSeleccionado) {
          this.presentToast('⚠️ Debe seleccionar un lugar de donación primero');
          return;
        }
        
        const lugar = JSON.parse(lugarSeleccionado);
        await this.debugToast(`Lugar: ${lugar.nombre || 'Sin nombre'}`);
        
        // Datos para el endpoint /donaciones/qr/
        const donacionData: any = {
          rut: scannedData.rut,
          centro_id: lugar.centro_id,
          tipo_donacion: lugar.tipo === 'campana' ? 'campana' : 'punto'
        };

        // Si es una campaña, agregar el ID de campaña
        if (lugar.tipo === 'campana' && lugar.campana_id) {
          donacionData.campana_id = lugar.campana_id;
        }

        await this.debugToast('Enviando al servidor...');

        this.apiService.guardarDonacionQR(donacionData).subscribe({
          next: (response) => {
            this.presentToast('✅ Donación registrada exitosamente');
            // Limpiar lugar seleccionado después del éxito
            localStorage.removeItem('lugarDonacionSeleccionado');
          },
          error: (error) => {
            this.debugToast(`Error ${error.status}: ${error.message}`);
            
            let errorMessage = 'Error al registrar la donación';
            if (error.status === 400) {
              errorMessage = 'Datos inválidos. Verifique la información.';
            } else if (error.status === 401) {
              errorMessage = 'No autorizado. Inicie sesión nuevamente.';
            } else if (error.status === 403) {
              errorMessage = 'Solo representantes pueden registrar donaciones por QR.';
            } else if (error.status === 404) {
              errorMessage = 'Donante o centro no encontrado.';
            } else if (error.status === 500) {
              errorMessage = 'Error del servidor. Intente más tarde.';
            }
            
            this.presentToast(`❌ ${errorMessage}`);
          }
        });
      } catch (e) {
        await this.debugToast(`Error JSON: ${e}`);
        this.presentToast('❌ QR inválido o mal formateado');
      }
    } else {
      this.presentToast('ℹ️ Escaneo cancelado');
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private async debugToast(message: string) {
    if (this.debugMode) {
      const toast = await this.toastController.create({
        message: `DEBUG: ${message}`,
        duration: 4000,
        position: 'top',
        color: 'warning'
      });
      await toast.present();
    }
  }
}
