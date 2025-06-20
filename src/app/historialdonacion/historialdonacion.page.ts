import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DonacionHistorial } from '../interfaces/donacion-historial.interface';

@Component({
  selector: 'app-Historialdonacion',
  templateUrl: './Historialdonacion.page.html',
  styleUrls: ['./Historialdonacion.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
})
export class HistorialdonacionPage implements OnInit {
  donaciones: DonacionHistorial[] = [];

  constructor(private router: Router,
    private toastController: ToastController,
    private apiService: ApiService
) {}

ngOnInit() {
  this.cargarHistorial();
}

cargarHistorial() {
  this.apiService.getHistorialDonaciones().subscribe({
    next: (data) => {
      console.log('Datos del historial recibidos:', data);
      this.donaciones = data.donaciones || [];
    },    
    error: async (err) => {
      console.error('Error al obtener historial:', err);
      const toast = await this.toastController.create({
        message: 'Error al cargar el historial de donaciones.',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    }
  });
}

// Formatear fecha de manera más amigable
formatearFecha(fecha: string): string {
  if (!fecha) return 'Fecha no disponible';
  
  const date = new Date(fecha);
  const opciones: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('es-ES', opciones);
}

// Obtener nombre del centro de donación
getCentroName(donacion: DonacionHistorial): string {
  if (donacion.centro_nombre) {
    return donacion.centro_nombre;
  }
  if (donacion.centro) {
    return donacion.centro;
  }
  if (donacion.centro_donacion && donacion.centro_donacion.nombre) {
    return donacion.centro_donacion.nombre;
  }
  return 'Centro no especificado';
}

// Navegar a detalles pasando información completa
irADetalle(donacion: DonacionHistorial, index: number) {
  // Pasar toda la información de la donación a la página de detalles
  this.router.navigate(['/menu/detallesh'], {
    state: {
      donacion: donacion,
      index: index
    }
  });
}

}
