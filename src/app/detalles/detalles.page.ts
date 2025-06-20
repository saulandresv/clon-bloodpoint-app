import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DonationCentersService } from '../services/donation-centers.service';
import { GeocodingService } from '../services/geocoding.service';
import { DonationCenter } from '../interfaces/donation-center.interface';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-detalles',
  templateUrl: './detalles.page.html',
  styleUrls: ['./detalles.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class DetallesPage implements OnInit {
  center?: DonationCenter;
  private currentLocation: [number, number] | null = null;

  constructor(
    private route: ActivatedRoute,
    private donationService: DonationCentersService,
    private geocodingService: GeocodingService,
    private navCtrl: NavController,
    private toastController: ToastController,
    private apiService: ApiService
  ) {}

  isLoading = false;

  ngOnInit() {
    this.requestLocationPermission();

    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        const guardado = localStorage.getItem('ultimo_centro');
        if (guardado) {
          try {
          const centroGuardado: DonationCenter = JSON.parse(guardado);
            // Usar el centro guardado si existe, sin importar si el ID coincide exactamente
            // (para manejar campañas con IDs artificiales)
            if (centroGuardado && (Math.abs(centroGuardado.id_centro || 0) === Math.abs(+id) || centroGuardado.id_centro === +id)) {
            console.log('✅ Usando centro guardado con distancia:', centroGuardado);
            this.center = centroGuardado;
            localStorage.removeItem('ultimo_centro');
            return;
          }
            // Si existe localStorage pero no coincide ID, úsalo de todas formas para campañas
            else if (centroGuardado && centroGuardado.tipo === 'campana') {
              console.log('✅ Usando campaña guardada (ID diferente):', centroGuardado);
              this.center = centroGuardado;
              localStorage.removeItem('ultimo_centro');
              return;
            }
          } catch (e) {
            console.warn('Error parsing localStorage:', e);
            localStorage.removeItem('ultimo_centro');
          }
        }
        
        // Solo intentar petición HTTP para IDs positivos (centros reales)
        if (+id > 0) {
        this.donationService.getCenterById(+id).subscribe({
          next: async (center) => {
            console.log("Centro recibido:", center);

            if (!center) {
              console.warn("No se encontró el centro con ID:", id);
              this.navCtrl.navigateBack('/menu/puntosdonacion');
              return;
            }

            this.center = center;

            // Obtener coordenadas si están disponibles
            if (!center.coordenadas || !Array.isArray(center.coordenadas) || center.coordenadas.length !== 2) {
              center.coordenadas = await this.geocodingService.getCoordinates(center.direccion_centro);
            }

            if (!center.coordenadas) {
              console.warn("Centro sin coordenadas válidas:", center);
              this.center.distancia = "Coordenadas no disponibles";
            } else if (this.currentLocation) {
              await this.calculateDistance(center);
            }
          },
          error: async (error) => {
            console.error('Error cargando el centro:', error);
            const toast = await this.toastController.create({
              message: "No se pudo cargar el centro de donación.",
              duration: 3000,
              position: "top",
              color: "danger",
            });
            await toast.present();
            this.navCtrl.navigateBack('/menu/puntosdonacion');
          }
        });
        } else {
          // Para IDs negativos (campañas), mostrar mensaje si no hay localStorage
          console.warn('No se encontró información para campaña con ID:', id);
          this.toastController.create({
            message: "No se pudo cargar la información de la campaña.",
            duration: 3000,
            position: "top",
            color: "warning",
          }).then(toast => {
            toast.present();
            this.navCtrl.navigateBack('/menu/puntosdonacion');
          });
        }
      }
    });
  }

  private async requestLocationPermission(): Promise<void> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.currentLocation = [position.coords.longitude, position.coords.latitude];
            console.log("Ubicación obtenida:", this.currentLocation);
            resolve();
          },
          async (error) => {
            console.warn("Permiso de ubicación denegado:", error);
            const toast = await this.toastController.create({
              message: "Para calcular rutas, debes permitir el acceso a tu ubicación.",
              duration: 3000,
              position: "top",
              color: "warning",
            });
            await toast.present();
            this.currentLocation = null;
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  }  

  private async calculateDistance(center: DonationCenter) {
    if (!this.currentLocation || !center.coordenadas || center.coordenadas.length !== 2) {
      console.warn("No se puede calcular la distancia, coordenadas inválidas:", center.coordenadas);
      center.distancia = "Coordenadas no disponibles";
      return;
    }

    try {
      console.log("Obteniendo ruta desde", this.currentLocation, "hasta", center.coordenadas);
      const response = await this.geocodingService.getRoute(this.currentLocation, center.coordenadas);

      center.distancia = response.distance >= 0 ? response.distance.toFixed(1) + " km" : "No disponible";
    } catch (error) {
      console.error("Error obteniendo distancia:", error);
      center.distancia = "No disponible";
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  async calcularRutaYMostrarEnMapa() {
    this.isLoading = true;
  
    try {
      console.log('🚀 Iniciando cálculo de ruta...');
      await this.requestLocationPermission();
  
      if (!this.center) {
        console.warn('❌ No hay centro seleccionado');
        throw new Error('No hay centro seleccionado');
      }
  
      if (!this.currentLocation) {
        console.warn('❌ No hay ubicación actual disponible');
        const toast = await this.toastController.create({
          message: 'Para calcular la ruta, debes permitir el acceso a tu ubicación.',
          duration: 2500,
          color: 'warning',
        });
        await toast.present();
        throw new Error('Ubicación no disponible');
      }
  
      console.log('📍 Ubicación actual:', this.currentLocation);
      console.log('🎯 Centro seleccionado:', this.center);
  
      if (!this.center.coordenadas || this.center.coordenadas.length !== 2) {
        console.log('🔄 Obteniendo coordenadas del centro...');
        this.center.coordenadas = await this.geocodingService.getCoordinates(this.center.direccion_centro);
        console.log('📍 Coordenadas obtenidas:', this.center.coordenadas);
      }
  
      const [lng, lat] = this.center.coordenadas;
      const dentroDeChile = lng >= -76 && lng <= -66 && lat >= -56 && lat <= -17;
  
      if (!dentroDeChile) {
        console.warn('❌ Coordenadas fuera de Chile:', this.center.coordenadas);
        const toast = await this.toastController.create({
          message: 'Las coordenadas del centro están fuera de Chile. Verifica la dirección.',
          duration: 3000,
          color: 'warning',
        });
        await toast.present();
        throw new Error('Coordenadas fuera de Chile');
      }
  
      const routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${this.currentLocation[0]},${this.currentLocation[1]};${this.center.coordenadas[0]},${this.center.coordenadas[1]}?geometries=geojson&access_token=${environment.mapbox.accessToken}`;
      console.log('🔄 Obteniendo ruta desde Mapbox...');
      const response = await fetch(routeUrl);
      const data = await response.json();
  
      if (!data.routes.length) {
        throw new Error('No se encontró una ruta.');
      }
  
      const ruta = {
        destino: this.center.coordenadas,
        nombreCentro: this.center.nombre_centro,
        geometry: data.routes[0].geometry,
        distance: data.routes[0].distance / 1000
      };
  
      localStorage.setItem('ruta_actual', JSON.stringify(ruta));
      this.navCtrl.navigateForward(['/menu/index'], { queryParams: { ruta: true } });
    } catch (error) {
      console.error('❌ Error al calcular o guardar la ruta:', error);
      const toast = await this.toastController.create({
        message: 'Error al calcular la ruta. Por favor, intenta nuevamente.',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.isLoading = false; // Siempre se ejecuta
    }
  }    

}