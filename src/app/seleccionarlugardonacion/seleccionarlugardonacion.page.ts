import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { UserService } from '../services/user.service';
import { DonationCenter } from '../interfaces/donation-center.interface';
import { CampanaActiva } from '../interfaces/campana.interface';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seleccionarlugardonacion',
  templateUrl: './seleccionarlugardonacion.page.html',
  styleUrls: ['./seleccionarlugardonacion.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SeleccionarlugardonacionPage implements OnInit {
  isRepresentante: boolean = false;
  loading: boolean = true;
  
  // Solo necesitamos los centros del representante
  centrosDelRepresentante: DonationCenter[] = [];
  
  representanteId: number = 0;
  selectedCentro: DonationCenter | null = null;

  constructor(
    private api: ApiService,
    private userService: UserService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.userService.getUserId().subscribe(userId => {
      this.representanteId = Number(userId);
      this.userService.isRepresentante(userId).subscribe(isRep => {
        this.isRepresentante = isRep;
        if (!isRep) {
          this.router.navigate(['/menu/index']);
        } else {
          this.cargarDatosDelRepresentante();
        }
      });
    });
  }

  cargarDatosDelRepresentante() {
    this.loading = true;
    
    // ✅ LOGS PARA COMPARAR CON INDEX
    console.log('🏢 [ADMIN] representanteId:', this.representanteId);
    console.log('🏢 [ADMIN] URL completa:', `representante=${this.representanteId}&campanas=true`);
    
    // Cargar centros del representante específico con sus campañas
    this.api.getCentrosDonacion(`representante=${this.representanteId}&campanas=true`).subscribe({
      next: (res) => {
        this.centrosDelRepresentante = res.data || res;
        console.log('🏢 [ADMIN] Centros del representante RAW:', res);
        console.log('🏢 [ADMIN] Centros del representante procesados:', this.centrosDelRepresentante);
        console.log('🔢 [ADMIN] Cantidad de centros:', this.centrosDelRepresentante?.length || 0);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando centros:', error);
        this.loading = false;
        this.showToast('Error cargando centros', 'danger');
      }
    });
  }

  seleccionarCentro(centro: DonationCenter) {
    // Si es el mismo centro que ya está seleccionado, lo deseleccionamos (colapsar)
    if (this.selectedCentro?.id_centro === centro.id_centro) {
      this.selectedCentro = null;
    } else {
      // Si es un centro diferente o no hay ninguno seleccionado, lo seleccionamos
      this.selectedCentro = centro;
    }
  }

  get campanasValidadas() {
    return this.selectedCentro?.campanas?.filter((c: any) => c.validada) ?? [];
  }

  get campanasNoValidadas() {
    return this.selectedCentro?.campanas?.filter((c: any) => !c.validada) ?? [];
  }

  async validarCampana(campana_id: any) {
    console.log('🔄 Validando campaña:', campana_id);
    
    this.api.validarCampana(campana_id).subscribe({
      next: async (res) => {
        console.log('✅ Campaña validada:', res);
        
        // Actualizar la campaña en la lista local
        if (this.selectedCentro?.campanas) {
          const campanaIndex = this.selectedCentro.campanas.findIndex((c: any) => c.id_campana === campana_id);
          if (campanaIndex !== -1) {
            this.selectedCentro.campanas[campanaIndex].validada = true;
          }
        }
        
        await this.showToast('✅ Campaña validada exitosamente', 'success');
        
        // Recargar datos para reflejar cambios
        this.cargarDatosDelRepresentante();
      },
      error: async (error) => {
        console.error('❌ Error validando campaña:', error);
        await this.showToast('❌ Error al validar campaña', 'danger');
      }
    });
  }

  async deshabilitarCampana(campana_id: any) {
    console.log('🚫 Deshabilitando campaña:', campana_id);
    
    // Aquí iría la lógica para deshabilitar una campaña
    // this.api.deshabilitarCampana(campana_id).subscribe({...})
    
    await this.showToast('🚫 Funcionalidad de deshabilitar en desarrollo', 'warning');
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}
