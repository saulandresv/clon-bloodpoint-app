import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { DonationCentersService } from '../services/donation-centers.service';
import { GeocodingService } from '../services/geocoding.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { DonationCenter } from '../interfaces/donation-center.interface';
import { environment } from 'src/environments/environment';
import { ApiService } from '../services/api.service';
import { CampanaActiva } from '../interfaces/campana.interface';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-puntosdonacion',
  templateUrl: './puntosdonacion.page.html',
  styleUrls: ['./puntosdonacion.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PuntosdonacionPage implements OnInit, OnDestroy {
  showOnlyOpen: boolean = false;
  filteredCenters: DonationCenter[] = [];
  donationCenters: DonationCenter[] = [];
  selectedLocation: string = '';
  private centersSubscription!: Subscription;
  private currentLocation: [number, number] | null = null;
  selectedTipoLugar: string = 'todos';
  isRepresentante: boolean = false;

  constructor(
    private donationService: DonationCentersService,
    private geocodingService: GeocodingService,
    private navCtrl: NavController,
    private router: Router,
    private toastController: ToastController,
    private apiService: ApiService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadCenters();
    this.requestLocationPermission();
    this.checkIfRepresentante();
  }

  ngOnDestroy() {
    if (this.centersSubscription) {
      this.centersSubscription.unsubscribe();
    }
  }

  private async loadCenters() {
    this.centersSubscription = this.donationService.getCenters().subscribe({
      next: async (centros) => {
        const transformedCenters = await Promise.all(centros.map(c => this.transformCenter(c)));
  
        console.log('🔄 Cargando campañas activas desde endpoint público...');
        this.apiService.getCampanasActivas().subscribe({
          next: async (response: { data: CampanaActiva[] }) => {
            console.log('✅ Respuesta de campañas activas:', response);
            console.log('📊 Estructura de respuesta:', Object.keys(response));
            const campanas = response.data;
            console.log('📝 Campañas obtenidas:', campanas);
            console.log('📏 Cantidad de campañas:', campanas ? campanas.length : 'undefined');
            const transformedCampanas = await Promise.all(campanas.map(async (c: CampanaActiva, index: number) => {
              // Convertir coordenadas inteligentemente
              let lat = parseFloat(c.latitud);
              let lon = parseFloat(c.longitud);
            
              console.log(`🏁 Campaña ${c.nombre_campana}: lat original=${lat}, lon original=${lon}`);
              
              // Auto-detectar formato y convertir a coordenadas válidas de Chile
              lat = this.normalizeCoordinate(lat, 'lat');
              lon = this.normalizeCoordinate(lon, 'lon');
              
              console.log(`✅ Campaña normalizada: ${c.nombre_campana} -> [${lon}, ${lat}]`);
              
              // Obtener información de dirección y comuna para la campaña
              let comuna = 'Comuna no identificada';
              let direccion = 'Ubicación definida por campaña';
              let centroAsociado = null; // Definir fuera del bloque para uso posterior
              
              // Si la campaña está asociada a un centro, buscar la dirección del centro
              if (c.id_centro) {
                centroAsociado = transformedCenters.find(centro => centro.id_centro === c.id_centro);
                if (centroAsociado) {
                  direccion = centroAsociado.direccion_centro;
                  comuna = centroAsociado.comuna; // Comuna ya calculada para el centro
                  console.log(`✅ Campaña ${c.nombre_campana}: usando dirección del centro -> ${direccion}`);
                }
              }
              
              // Si no hay centro asociado o no se encontró, usar geocodificación inversa
              if (!c.id_centro && !isNaN(lon) && !isNaN(lat) && lat !== 0 && lon !== 0) {
                try {
                  console.log(`🔍 Obteniendo dirección para campaña móvil: ${c.nombre_campana}`);
                  const locationInfo = await this.geocodingService.getReverseGeocode([lon, lat]);
                  if (locationInfo) {
                    comuna = locationInfo.comuna;
                    direccion = locationInfo.address;
                    console.log(`📍 Dirección obtenida para ${c.nombre_campana}: ${direccion}, ${comuna}`);
                  } else {
                    console.warn(`⚠️ No se pudo obtener dirección para ${c.nombre_campana}`);
                  }
                } catch (error) {
                  console.error(`❌ Error obteniendo dirección para ${c.nombre_campana}:`, error);
                }
              }
            
              // Crear nombre optimizado para solicitudes
              let nombreOptimizado = c.nombre_campana || 'Solicitud de campaña';
              
              // Si es una solicitud (tiene id_solicitud) y tipo de sangre, priorizar esa información
              if (c.id_solicitud && c.tipo_sangre_sol) {
                // Formato: "🩸 [TIPO_SANGRE] - [CENTRO] - [CANTIDAD] personas"
                const centro = c.centro || (centroAsociado ? centroAsociado.nombre_centro.split(' ').slice(0, 2).join(' ') : 'Centro');
                const cantidad = c.cantidad_personas || 'N/A';
                nombreOptimizado = `🩸 ${c.tipo_sangre_sol} - ${centro} - ${cantidad} personas`;
                console.log(`✅ Nombre optimizado para solicitud: ${nombreOptimizado}`);
              }
            
              const processedCampana = {
                id_centro: c.id_centro || -(index + 1), // ID único negativo para campañas sin centro
                nombre_centro: nombreOptimizado, // ✅ USAR NOMBRE OPTIMIZADO CON TIPO DE SANGRE
                direccion_centro: direccion,
                comuna: comuna,
                telefono: '',
                fecha_creacion: c.fecha_campana,
                created_at: c.fecha_campana,
                id_representante: null,
                tipo: 'campana' as 'campana',
                distancia: 'Calculando...',
                horario_apertura: c.apertura,
                horario_cierre: c.cierre,
                coordenadas: (!isNaN(lon) && !isNaN(lat) && lat !== 0 && lon !== 0) ? [lon, lat] as [number, number] : null
              };
              
              return processedCampana;
            }));
            
            
  
            this.donationCenters = [...transformedCenters, ...transformedCampanas];
            console.log('Donations loaded:', this.donationCenters);
            this.filteredCenters = [...this.donationCenters];
            console.log('Filtered centers:', this.filteredCenters);
            if (this.currentLocation) {
              await this.calculateRoutes();
            }
          },
          error: err => {
            console.error('❌ Error completo cargando campañas activas:', err);
            console.error('❌ Status del error:', err.status);
            console.error('❌ Mensaje del error:', err.message);
            console.error('❌ URL del error:', err.url);
            console.error('❌ Error body:', err.error);
            
            // Si falla el endpoint, continuar solo con centros
            this.donationCenters = transformedCenters;
            this.filteredCenters = [...this.donationCenters];
            console.log('⚠️ Continuando solo con centros de donación:', this.donationCenters.length);
          }
        });
      },
      error: async (error) => {
        const toast = await this.toastController.create({
          message: 'Error al cargar centros de donación',
          duration: 3000,
          position: 'top',
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  private async transformCenter(apiCenter: any): Promise<DonationCenter> {
    console.log(`🏥 Transformando centro: ${apiCenter.nombre_centro}`);
    console.log(`📍 Dirección original: ${apiCenter.direccion_centro}`);
    console.log(`🏛️ Comuna en BD (IGNORAR): ${apiCenter.comuna}`);
    
    // 1. Obtener coordenadas basándose SOLO en la dirección
    const coordenadas = await this.geocodingService.getCoordinates(apiCenter.direccion_centro);
    const validas = Array.isArray(coordenadas) &&
                    coordenadas.length === 2 &&
                    coordenadas.every(n => typeof n === 'number' && !isNaN(n)) &&
                    coordenadas[0] >= -180 && coordenadas[0] <= 180 &&
                    coordenadas[1] >= -90 && coordenadas[1] <= 90;
    
    let comunaCalculada = apiCenter.comuna; // Fallback por si falla la geocodificación
    
    // 2. Si las coordenadas son válidas, calcular la comuna correcta
    if (validas && coordenadas) {
      try {
        console.log(`🔍 Calculando comuna para coordenadas: [${coordenadas[0]}, ${coordenadas[1]}]`);
        const geoInfo = await this.geocodingService.getReverseGeocode(coordenadas as [number, number]);
        if (geoInfo && geoInfo.comuna) {
          comunaCalculada = geoInfo.comuna;
          console.log(`✅ Comuna calculada correctamente: ${comunaCalculada} (era ${apiCenter.comuna} en BD)`);
        } else {
          console.warn(`⚠️ No se pudo calcular comuna, usando la de BD: ${apiCenter.comuna}`);
        }
      } catch (error) {
        console.error('❌ Error calculando comuna:', error);
        console.warn(`⚠️ Usando comuna de BD por error: ${apiCenter.comuna}`);
      }
    } else {
      console.warn(`⚠️ Coordenadas inválidas, usando comuna de BD: ${apiCenter.comuna}`);
    }
    
    return {
      ...apiCenter,
      comuna: comunaCalculada, // ✅ USAR LA COMUNA CALCULADA, NO LA DE BD
      distancia: 'Calculando...',
      coordenadas: validas ? coordenadas as [number, number] : null,
      horario_apertura: apiCenter.horario_apertura || '',
      horario_cierre: apiCenter.horario_cierre || '',
      tipo: 'punto' // Asegurar que centros normales tengan tipo 'punto'
    };
  }

  private async requestLocationPermission() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.currentLocation = [position.coords.longitude, position.coords.latitude];
          await this.calculateRoutes();
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
        }
      );
    }
  }

  private async calculateRoutes() {
    if (!this.currentLocation) {
      console.warn("Ubicación del usuario no disponible.");
      return;
    }

    for (let center of this.donationCenters) {
      const coords = center.coordenadas;
    
      if (
        !coords || 
        coords.length !== 2 || 
        isNaN(coords[0]) || isNaN(coords[1]) || 
        Math.abs(coords[0]) > 180 || 
        Math.abs(coords[1]) > 90
      ) {
        console.warn('Centro con coordenadas inválidas:', center);
        continue;
      }
    

      try {
        const response = await this.geocodingService.getRoute(this.currentLocation, center.coordenadas as [number, number]);
        center.distancia = response.distance >= 0 ? response.distance.toFixed(1) + " km" : "No disponible";

        // Validar que los horarios de apertura y cierre existen antes de procesarlos
        const openTime = center.horario_apertura ? parseInt(center.horario_apertura.split(':')[0], 10) : null;
        const closeTime = center.horario_cierre ? parseInt(center.horario_cierre.split(':')[0], 10) : null;

        // Aquí puedes hacer algo con openTime y closeTime si es necesario
        console.log('Horas de apertura:', openTime, 'Horas de cierre:', closeTime);

      } catch (error) {
        console.error("Error calculando distancia:", error);
        center.distancia = "No disponible";
      }
    }

    this.filterCenters();
  }

  filterByLocation() {
    this.filteredCenters = this.selectedLocation
      ? this.donationCenters.filter(c => c.direccion_centro === this.selectedLocation)
      : [...this.donationCenters];
  }

  toggleOpenOnly() {
    this.showOnlyOpen = !this.showOnlyOpen;
    this.filterCenters();
  }

  filterCenters() {
    this.filteredCenters = this.donationCenters.filter(center => {
      const matchLocation = !this.selectedLocation || center.direccion_centro === this.selectedLocation;
      const matchTipo = this.selectedTipoLugar === 'todos' || center.tipo === this.selectedTipoLugar;
      return matchLocation && matchTipo;
    });
  }
  

  resetFilters() {
    this.selectedLocation = '';
    this.showOnlyOpen = false;
    this.filteredCenters = [...this.donationCenters];
  }

  get availableLocations(): string[] {
    return [...new Set(this.donationCenters.map(c => c.direccion_centro))];
  }

  showDetails(centerId: number | null) {
    if (!centerId) return; // No hacer nada si el ID es null
    const selectedCenter = this.donationCenters.find(c => c.id_centro === centerId);
    if (selectedCenter) {
      // Siempre guardar el centro completo en localStorage para que detalles lo use
      localStorage.setItem('ultimo_centro', JSON.stringify(selectedCenter));
      
      // Usar siempre /detalles, simplemente con el ID (positivo para compatibilidad)
      const navegarId = Math.abs(centerId);
      this.router.navigate(['/detalles', navegarId]);
    }
  }  

  private checkIfRepresentante() {
    this.userService.getUserId().subscribe((userId) => {
      if (userId) {
        this.userService.isRepresentante(Number(userId)).subscribe({
          next: (res) => {
            this.isRepresentante = res;
          },
          error: (err) => {
            console.warn('Error consultando representante:', err);
            this.isRepresentante = false;
          }
        });
      }
    });
  }

  private normalizeCoordinate(value: number, type: 'lat' | 'lon'): number {
    // Valores de referencia para Chile
    const chileRanges = {
      lat: { min: -56, max: -17 }, // Chile va desde Arica hasta Antártica
      lon: { min: -109, max: -66 } // Desde Isla de Pascua hasta frontera argentina
    };
    
    const isLat = type === 'lat';
    const expectedRange = isLat ? chileRanges.lat : chileRanges.lon;
    const santiagoDef = isLat ? -33.4489 : -70.6693;
    
    // Si ya está en rango válido de Chile, devolver tal como está
    if (value >= expectedRange.min && value <= expectedRange.max) {
      console.log(`✅ Coordenada ${type} ya válida: ${value}`);
      return value;
    }
    
    // Si es un entero muy grande (escalado), dividir por 1,000,000
    if (Math.abs(value) > 1000) {
      const scaled = value / 1000000;
      if (scaled >= expectedRange.min && scaled <= expectedRange.max) {
        console.log(`🔄 Coordenada ${type} escalada convertida: ${value} -> ${scaled}`);
        return scaled;
      }
    }
    
    // Si es un entero pequeño fuera de rango o cero, usar Santiago por defecto
    console.log(`⚠️ Coordenada ${type} inválida (${value}), usando Santiago: ${santiagoDef}`);
    return santiagoDef;
  }

}
