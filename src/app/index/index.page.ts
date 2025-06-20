import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import * as mapboxgl from 'mapbox-gl';
import { environment } from 'src/environments/environment';
import { DonationCentersService } from '../services/donation-centers.service';
import { GeocodingService } from '../services/geocoding.service';
import { Subscription } from 'rxjs';
import { DonationCenter } from '../interfaces/donation-center.interface';
import { UserService } from '../services/user.service';
import { AlertController } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { QrProfileComponent } from '../modals/qr-profile/qr-profile.component';
import { QrScannerComponent } from '../modals/qr-scanner/qr-scanner.component';

@Component({
  selector: 'app-index',
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class IndexPage implements OnInit, OnDestroy {
  donationCenters: DonationCenter[] = [];
  isRepresentante: boolean = false;
  sortedCenters: DonationCenter[] = [];
  private centersSubscription!: Subscription;
  private map!: mapboxgl.Map;
  private currentLocation: [number, number] | null = null;
  userId: number = 0;
  shouldDrawRoute = false;


  constructor(
    private donationService: DonationCentersService,
    private geocodingService: GeocodingService,
    private toastController: ToastController,
    private userService: UserService,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
  ) {
    (mapboxgl as any).accessToken = environment.mapbox.accessToken;
  }

  campanasDisponibles: any[] = [];
  centrosDisponibles: any[] = [];

  ngOnInit() {
    console.log('🏁 Iniciando IndexPage');
    
    // Primero verificar si hay parámetros de ruta
    this.route.queryParams.subscribe(params => {
      console.log('🔍 Parámetros de ruta recibidos:', params);
      if (params['ruta']) {
        console.log('✅ Parámetro ruta=true detectado');
        this.shouldDrawRoute = true;
        
        // Si ya tenemos el mapa y centros cargados, ejecutar inmediatamente
        if (this.map && this.donationCenters.length > 0) {
          console.log('🚀 Mapa y centros ya están listos, ejecutando verificación inmediatamente');
          setTimeout(() => {
            this.esperarYVerificarRutaGuardada();
          }, 500);
        }
      }
    });

    this.userService.getUserId().subscribe((id) => {
      this.userId = id;
      this.checkIfRepresentante();
      this.requestLocationPermission();
      this.loadCenters();
      // Cargar campañas después de obtener la información del usuario
      this.cargarCampanasDisponibles();
    });
  }
  
  

  private getUserId() {
    this.userService.getUserId().subscribe((id) => {
      this.userId = id;
      console.log('userId cargado:', this.userId);
      this.checkIfRepresentante();  // <-- Ahora se llama después de obtener el userId
    });
  }
    

  checkIfRepresentante() {
    console.log('Verificando si es representante:', this.userId);
    this.userService.isRepresentante(Number(this.userId)).subscribe({
      next: (res) => {
        console.log('¿Es representante?', res);
        this.isRepresentante = res;
      },
      error: (err) => {
        console.warn('Error consultando representante:', err);
        this.isRepresentante = false;
      }
    });
  }
  

  ngOnDestroy() {
    if (this.centersSubscription) {
      this.centersSubscription.unsubscribe();
    }
  }

  private loadCenters() {
    this.centersSubscription = this.donationService.getCenters().subscribe({
      next: async (centers) => {
        this.donationCenters = await Promise.all(
          centers.map(center => this.transformCenter(center))
        );
        this.sortedCenters = [...this.donationCenters];
        this.initializeMap();
        this.addDonationCenterMarkers();
        this.sortedCenters = [...this.donationCenters];
        this.initializeMap();
        this.addDonationCenterMarkers();

        setTimeout(() => {
          console.log('⏰ Verificando si debe dibujar ruta...', 'shouldDrawRoute:', this.shouldDrawRoute);
          if (this.shouldDrawRoute) {
            console.log('✅ Iniciando esperarYVerificarRutaGuardada...');
            this.esperarYVerificarRutaGuardada();
          } else {
            console.log('❌ No se debe dibujar ruta');
          }
        }, 1000);  // Espera un segundo para asegurarse que todo está listo

        
                      },
      error: async (error) => {
        console.error('Error cargando centros:', error);
        const toast = await this.toastController.create({
          message: 'Error al cargar centros de donación',
          duration: 3000,
          position: 'top',
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  private async transformCenter(apiCenter: any): Promise<DonationCenter> {
    console.log(`🏥 [INDEX] Transformando centro: ${apiCenter.nombre_centro}`);
    console.log(`📍 [INDEX] Dirección original: ${apiCenter.direccion_centro}`);
    console.log(`🏛️ [INDEX] Comuna en BD (IGNORAR): ${apiCenter.comuna}`);
    
    // 1. Obtener coordenadas basándose SOLO en la dirección
    const coordenadas = await this.geocodingService.getCoordinates(apiCenter.direccion_centro);
    
    let comunaCalculada = apiCenter.comuna; // Fallback por si falla la geocodificación
    
    // 2. Si las coordenadas son válidas, calcular la comuna correcta
    if (coordenadas && Array.isArray(coordenadas) && coordenadas.length === 2) {
      try {
        console.log(`🔍 [INDEX] Calculando comuna para coordenadas: [${coordenadas[0]}, ${coordenadas[1]}]`);
        const geoInfo = await this.geocodingService.getReverseGeocode(coordenadas as [number, number]);
        if (geoInfo && geoInfo.comuna) {
          comunaCalculada = geoInfo.comuna;
          console.log(`✅ [INDEX] Comuna calculada correctamente: ${comunaCalculada} (era ${apiCenter.comuna} en BD)`);
        } else {
          console.warn(`⚠️ [INDEX] No se pudo calcular comuna, usando la de BD: ${apiCenter.comuna}`);
        }
      } catch (error) {
        console.error('❌ [INDEX] Error calculando comuna:', error);
        console.warn(`⚠️ [INDEX] Usando comuna de BD por error: ${apiCenter.comuna}`);
      }
    } else {
      console.warn(`⚠️ [INDEX] Coordenadas inválidas, usando comuna de BD: ${apiCenter.comuna}`);
    }
    
    return {
      id_centro: apiCenter.id_centro,
      nombre_centro: apiCenter.nombre_centro,
      direccion_centro: apiCenter.direccion_centro,
      comuna: comunaCalculada, // ✅ USAR LA COMUNA CALCULADA, NO LA DE BD
      telefono: apiCenter.telefono,
      fecha_creacion: apiCenter.fecha_creacion,
      created_at: apiCenter.created_at,
      id_representante: apiCenter.id_representante,
      distancia: 'Calculando...',
      coordenadas,
      tipo: 'punto',
    };
  }

  private initializeMap(): void {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [-70.6483, -33.4489], // Santiago de Chile
      zoom: 12,
      attributionControl: false
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    this.map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );
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

  async focusOnCenter(center: DonationCenter) {
    if (center.coordenadas) {
      this.map.flyTo({
        center: center.coordenadas,
        zoom: 15
      });

      if (this.currentLocation) {
        if (center.coordenadas && center.coordenadas.length === 2) {
          await this.getRouteToCenter(center.coordenadas as [number, number]);
        }
              } else {
        console.warn("Ubicación del usuario no disponible para calcular la ruta.");
      }
    }
  }

  private async getRouteToCenter(destination: [number, number]) {
    if (!this.currentLocation) return;

    const routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${this.currentLocation[0]},${this.currentLocation[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${environment.mapbox.accessToken}`;

    try {
      const response = await fetch(routeUrl);
      const data = await response.json();

      if (!data.routes.length) throw new Error('No se encontró una ruta.');

      this.displayRoute(data.routes[0].geometry);
    } catch (error) {
      console.error("Error obteniendo la ruta:", error);
    }
  }

  private displayRoute(routeGeometry: any) {
    if (this.map.getLayer('temp-route-line')) {
      this.map.removeLayer('temp-route-line');
      this.map.removeSource('temp-route');
    }

    this.map.addSource('temp-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: routeGeometry
      }
    });

    this.map.addLayer({
      id: 'temp-route-line',
      type: 'line',
      source: 'temp-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#DD4B4B',
        'line-width': 5
      }
    });
  }

  private async calculateRoutes() {
    if (!this.currentLocation) {
      console.warn("Ubicación del usuario no disponible.");
      return;
    }

    for (let center of this.donationCenters) {
      if (!center.coordenadas) continue;

      try {
        const response = await this.geocodingService.getRoute(this.currentLocation, center.coordenadas);
        center.distancia = response.distance >= 0 ? response.distance.toFixed(1) + " km" : "No disponible";
      } catch (error) {
        console.error("Error calculando distancia:", error);
        center.distancia = "No disponible";
      }
    }

    this.sortCenters();
  }

  private sortCenters() {
    this.sortedCenters = [...this.donationCenters].sort((a, b) => {
      const distanceA = parseFloat(a.distancia || '0');
      const distanceB = parseFloat(b.distancia || '0');
      return distanceA - distanceB;
    });
  }

  cargarCampanasDisponibles() {
    // Para usuarios donantes, usar el endpoint público de campañas activas
    this.apiService.getCampanasActivas().subscribe({
      next: (response: any) => {
        console.log('📋 Respuesta de campañas activas:', response);
        // El endpoint devuelve un objeto con { status, data }
        const campanas = response.data || response;
        // Filtrar solo campañas validadas (ya vienen filtradas del backend)
        this.campanasDisponibles = Array.isArray(campanas) ? campanas : [];
        
                // Convertir campañas a formato de centros para mostrar en el mapa
        this.campanasDisponibles.forEach(async campana => {
          // Para campañas con centro asociado, usar las coordenadas del centro
          if (campana.id_centro) {
            const centro = this.donationCenters.find(c => c.id_centro === campana.id_centro);
            if (centro && centro.coordenadas) {
              // Crear nombre optimizado para solicitudes asociadas a centros
              let nombreOptimizado = campana.nombre_campana || 'Campaña';
              
              // Si es una solicitud (tiene id_solicitud) y tipo de sangre, priorizar esa información
              if (campana.id_solicitud && campana.tipo_sangre_sol) {
                // Formato: "🩸 [TIPO_SANGRE] - [CENTRO_CORTO] - [CANTIDAD] personas"
                const centroCorto = centro.nombre_centro.split(' ').slice(0, 2).join(' ');
                const cantidad = campana.cantidad_personas || 'N/A';
                nombreOptimizado = `🩸 ${campana.tipo_sangre_sol} - ${centroCorto} - ${cantidad} personas`;
                console.log(`✅ Nombre optimizado para solicitud en centro: ${nombreOptimizado}`);
              }
              
              const campanaMarker = {
                id_centro: null,
                nombre_centro: nombreOptimizado, // ✅ USAR NOMBRE OPTIMIZADO CON TIPO DE SANGRE
                direccion_centro: centro.direccion_centro, // ✅ DIRECCIÓN DEL CENTRO ASOCIADO
                comuna: centro.comuna, // ✅ COMUNA CALCULADA DEL CENTRO
                telefono: centro.telefono,
                fecha_creacion: '',
                created_at: '',
                id_representante: null,
                tipo: 'campana' as const,
                distancia: '0 km',
                horario_apertura: campana.apertura,
                horario_cierre: campana.cierre,
                coordenadas: centro.coordenadas // Usar coordenadas reales del centro
              };
              
              const existeYa = this.donationCenters.find(c => 
                c.tipo === 'campana' && c.nombre_centro === campana.nombre_campana
              );
              
              if (!existeYa) {
                this.donationCenters.push(campanaMarker);
                this.addMarkerToMap(campanaMarker);
              }
            }
          }
          // Para campañas sin centro (móviles), usar geocoding si hay coordenadas válidas
          else if (campana.latitud && campana.longitud) {
            try {
              console.log(`🏁 Campaña ${campana.nombre_campana}: lat original=${campana.latitud}, lon original=${campana.longitud}`);
              
              // Convertir a números si vienen como strings, manteniendo máxima precisión
              const latOriginal = typeof campana.latitud === 'string' ? parseFloat(campana.latitud) : campana.latitud;
              const lngOriginal = typeof campana.longitud === 'string' ? parseFloat(campana.longitud) : campana.longitud;
              
              console.log(`🔍 Campaña ${campana.nombre_campana}: lat parseado=${latOriginal}, lon parseado=${lngOriginal}`);
              
              // Verificar si las coordenadas ya están en el rango correcto de Chile
              const latValida = latOriginal >= -56 && latOriginal <= -17 && latOriginal !== 0;
              const lngValida = lngOriginal >= -76 && lngOriginal <= -66 && lngOriginal !== 0;
              
              let lat, lng;
              
              if (latValida && lngValida) {
                // Si las coordenadas ya están en rango válido, usarlas directamente
                lat = latOriginal;
                lng = lngOriginal;
                console.log(`✅ Campaña ${campana.nombre_campana}: coordenadas ya válidas -> [${lng}, ${lat}]`);
              } else {
                // Solo normalizar si están fuera de rango
                lat = this.normalizeCoordinate(latOriginal, 'lat');
                lng = this.normalizeCoordinate(lngOriginal, 'lon');
                console.log(`🔄 Campaña ${campana.nombre_campana}: coordenadas normalizadas -> [${lng}, ${lat}]`);
              }
              
              // Verificar precisión - si las coordenadas tienen muchos decimales, mantenerlas
              const precision = Math.max(
                (latOriginal.toString().split('.')[1] || '').length,
                (lngOriginal.toString().split('.')[1] || '').length
              );
              
              if (precision > 6) {
                console.log(`🎯 Campaña ${campana.nombre_campana}: alta precisión detectada (${precision} decimales)`);
              }
              
              // Validación final: asegurar que las coordenadas están dentro de rangos globales válidos
              if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
                console.warn(`⚠️ Coordenadas finales inválidas para ${campana.nombre_campana}: [${lng}, ${lat}]`);
                return; // Saltar esta campaña
              }
              
              // Obtener dirección y comuna para la campaña móvil
              let direccionCampana = 'Ubicación personalizada';
              let comunaCampana = 'Comuna no identificada';
              
              try {
                const locationInfo = await this.geocodingService.getReverseGeocode([lng, lat]);
                if (locationInfo) {
                  direccionCampana = locationInfo.address;
                  comunaCampana = locationInfo.comuna;
                  console.log(`📍 [INDEX] Dirección calculada para ${campana.nombre_campana}: ${direccionCampana}, ${comunaCampana}`);
                }
              } catch (error) {
                console.warn(`⚠️ [INDEX] No se pudo calcular dirección para ${campana.nombre_campana}:`, error);
              }
              
              // Crear nombre optimizado para solicitudes
              let nombreOptimizado = campana.nombre_campana || 'Campaña móvil';
              
              // Si es una solicitud (tiene id_solicitud) y tipo de sangre, priorizar esa información
              if (campana.id_solicitud && campana.tipo_sangre_sol) {
                // Formato: "🩸 [TIPO_SANGRE] - Móvil - [CANTIDAD] personas"
                const cantidad = campana.cantidad_personas || 'N/A';
                nombreOptimizado = `🩸 ${campana.tipo_sangre_sol} - Móvil - ${cantidad} personas`;
                console.log(`✅ Nombre optimizado para solicitud móvil: ${nombreOptimizado}`);
              }
              
              const campanaMarker = {
                id_centro: null,
                nombre_centro: nombreOptimizado, // ✅ USAR NOMBRE OPTIMIZADO CON TIPO DE SANGRE
                direccion_centro: direccionCampana,
                comuna: comunaCampana,
                telefono: '',
                fecha_creacion: '',
                created_at: '',
                id_representante: null,
                tipo: 'campana' as const,
                distancia: '0 km',
                horario_apertura: campana.apertura,
                horario_cierre: campana.cierre,
                coordenadas: [lng, lat] as [number, number]
              };
              
              const existeYa = this.donationCenters.find(c => 
                c.tipo === 'campana' && c.nombre_centro === campana.nombre_campana
              );
              
              if (!existeYa) {
                this.donationCenters.push(campanaMarker);
                this.addMarkerToMap(campanaMarker);
                console.log(`📍 Marcador agregado para campaña ${campana.nombre_campana} en [${lng}, ${lat}]`);
              }
            } catch (error) {
              console.error('Error procesando coordenadas de campaña:', error);
            }
          } else {
            console.warn(`⚠️ Campaña ${campana.nombre_campana} sin coordenadas válidas:`, {
              latitud: campana.latitud,
              longitud: campana.longitud,
              id_centro: campana.id_centro
            });
          }
        });
        
        console.log('📋 Campañas cargadas:', this.campanasDisponibles);
        console.log('🗺️ Centros con campañas agregadas:', this.donationCenters);
      },
      error: (error) => {
        console.error('Error al cargar campañas:', error);
        // En caso de error, inicializar array vacío para evitar errores en la UI
        this.campanasDisponibles = [];
        
        // Mostrar mensaje al usuario si es necesario
        if (error.status === 403) {
          console.warn('⚠️ Acceso denegado a campañas. Usuario puede ser donante regular.');
        } else if (error.status === 401) {
          console.warn('⚠️ Token de autenticación inválido o expirado.');
        }
      }
    });
  }
  
  toggleCampanaSelection(campana: any) {
    // Limpiar selección anterior
    this.campanasDisponibles.forEach(c => c.selected = false);
    // Seleccionar la campaña actual
    campana.selected = true;
  }
  
  seleccionarCampana(campana: any) {
    // Marcar como seleccionada
    this.toggleCampanaSelection(campana);
    
    const lugar = {
      tipo: 'campana',
      campana_id: campana.id_campana,
      centro_id: campana.id_centro || null
    };
    localStorage.setItem('lugarDonacionSeleccionado', JSON.stringify(lugar));
    this.showToast('📍 Campaña seleccionada correctamente', 'success');
  }
  

  async addNewDonationCenter() {
    const alert = await this.alertController.create({
      header: 'Nuevo Centro de Donación',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre del centro'
        },
        {
          name: 'direccion',
          type: 'text',
          placeholder: 'Dirección del centro'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: async (data) => {
            if (!data.nombre || !data.direccion) {
              this.showToast('Debe completar ambos campos.', 'warning');
              return false;
            }

            try {
              const coordenadas = await this.geocodingService.getCoordinates(data.direccion);

              const nuevoCentro = {
                nombre_centro: data.nombre,
                direccion_centro: data.direccion,
                comuna: '',
                telefono: '',
                fecha_creacion: new Date().toISOString().split('T')[0],
                id_representante: this.userId
              };

              const creado = await this.donationService.createDonationCenter(nuevoCentro).toPromise();

              if (!creado) {
                this.showToast('No se pudo crear el centro.', 'danger');
                return false;
              }

              creado.coordenadas = coordenadas;

              this.donationCenters.push(creado);
              this.sortedCenters.push(creado);
              this.addMarkerToMap(creado); // Agregamos el marcador al mapa
              this.showToast('Centro creado con éxito.', 'success');
              return true;
            } catch (err) {
              console.error(err);
              this.showToast('Error al crear el centro.', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private addMarkerToMap(center: DonationCenter): void {
    if (center.coordenadas) {
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div>
            <h4>${center.nombre_centro}</h4>
            <p><strong>Comuna:</strong> ${center.comuna}</p>
            <p><strong>Dirección:</strong> ${center.direccion_centro}</p>
            <p><strong>Distancia:</strong> ${center.distancia}</p>
            <p><strong>Teléfono:</strong> ${center.telefono || 'No disponible'}</p>
          </div>
        `);
        
      new mapboxgl.Marker({ color: '#DD4B4B', scale: 0.8 })
        .setLngLat(center.coordenadas)
        .setPopup(popup)
        .addTo(this.map);
    }
  }


  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  // Nueva función para agregar los marcadores de los centros de donación en el mapa
  private addDonationCenterMarkers() {
    this.donationCenters.forEach(center => {
      if (center.coordenadas) {
        this.addMarkerToMap(center);
      }
    });
  }

  // Variables para el formulario integrado
  private campanaDatos: any = {};
  private ubicacionSeleccionada: { lat: number, lng: number, tipo: string, descripcion: string } | null = null;

  async abrirFormularioCampana() {
    // Resetear datos
    this.campanaDatos = {};
    this.ubicacionSeleccionada = null;
    
    // Obtener centros del representante específico
    this.apiService.getCentrosDonacion(`representante=${this.userId}&campanas=true`).subscribe({
      next: async (res) => {
        const centrosDelRepresentante = res.data || res;
        
        // ✅ AGREGAR ESTOS LOGS PARA DEBUG
        console.log('🏢 Centros del representante RAW:', res);
        console.log('🏢 Centros del representante procesados:', centrosDelRepresentante);
        console.log('🔢 Cantidad de centros:', centrosDelRepresentante?.length || 0);
        
        // Guardar centros para usar después
        this.centrosDisponibles = centrosDelRepresentante;
        
        // Si tiene varios centros, abrir selector con grid
        if (centrosDelRepresentante.length > 1) {
          this.abrirSelectorCentroGrid(centrosDelRepresentante);
          return;
        }
        
        // Si tiene solo un centro, mostrar formulario directo
        const centroUnico = centrosDelRepresentante[0];
        
        const alert = await this.alertController.create({
          header: 'Crear Campaña',
          inputs: [
            {
              name: 'nombre_campana',
              type: 'text',
              placeholder: 'Nombre de la campaña'
            },
            {
              name: 'fecha_campana',
              type: 'date',
              placeholder: 'Fecha de inicio de la campaña'
            },
            {
              name: 'fecha_termino',
              type: 'date',
              placeholder: 'Fecha de término de la campaña'
            },
            {
              name: 'apertura',
              type: 'time',
              placeholder: 'Hora de apertura (ej: 08:00)'
            },
            {
              name: 'cierre',
              type: 'time',
              placeholder: 'Hora de cierre (ej: 18:00)'
            },
            {
              name: 'meta',
              type: 'text',
              placeholder: 'Meta de donaciones'
            },
            {
              name: 'separador',
              type: 'text',
              value: '--- UBICACIÓN ---',
              disabled: true
            },
            {
              name: 'centro_info',
              type: 'text',
              value: `📍 Se usará: ${centroUnico.nombre_centro}`,
              disabled: true
            }
          ],
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Seleccionar en el mapa',
              handler: (data) => {
                this.campanaDatos = data;
                setTimeout(() => {
                  this.abrirSelectorMapaIntegrado(data);
                }, 100);
                return true;
              }
            },
            {
              text: 'Confirmar',
              handler: async (data) => {
                // Usar el centro único automáticamente
                const nuevaCampana = {
                  ...data,
                  latitud: centroUnico.latitud || -33.4489,
                  longitud: centroUnico.longitud || -70.6693,
                  id_centro: centroUnico.id_centro
                };
                
                console.log('📍 Usando centro único:', centroUnico.nombre_centro);
                await this.enviarCampana(nuevaCampana);
                return true;
              }
            }
          ]
        });
        
        await alert.present();
      },
      error: (error) => {
        console.error('❌ Error al cargar centros:', error);
        this.showToast('Error al cargar centros', 'danger');
      }
    });
  }

  async abrirSelectorCentroGrid(centros: any[]) {
    // Crear inputs para el formulario principal
    const formInputs: any[] = [
      {
        name: 'nombre_campana',
        type: 'text' as const,
        placeholder: 'Nombre de la campaña'
      },
      {
        name: 'fecha_campana',
        type: 'date' as const,
        placeholder: 'Fecha de inicio de la campaña'
      },
      {
        name: 'fecha_termino',
        type: 'date' as const,
        placeholder: 'Fecha de término de la campaña'
      },
      {
        name: 'apertura',
        type: 'time' as const,
        placeholder: 'Hora de apertura (ej: 08:00)'
      },
      {
        name: 'cierre',
        type: 'time' as const,
        placeholder: 'Hora de cierre (ej: 18:00)'
      },
      {
        name: 'meta',
        type: 'text' as const,
        placeholder: 'Meta de donaciones'
      },
      {
        name: 'separador',
        type: 'text' as const,
        value: '--- SELECCIONAR CENTRO ---',
        disabled: true
      }
    ];

    // Agregar radio buttons para cada centro (ahora deberían funcionar mejor sin handlers)
    centros.forEach((centro, index) => {
      formInputs.push({
        name: 'centro_selected',
        type: 'radio' as const,
        label: centro.nombre_centro,
        value: centro.id_centro.toString(),
        checked: index === 0
      });
    });

    const alert = await this.alertController.create({
      header: 'Crear Campaña',
      inputs: formInputs,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Seleccionar en el mapa',
          handler: (data) => {
            this.campanaDatos = data;
            setTimeout(() => {
              this.abrirSelectorMapaIntegrado(data);
            }, 100);
            return true;
          }
        },
        {
          text: 'Confirmar',
          handler: async (data) => {
            console.log('📋 Datos del formulario:', data);
            
            // Buscar el centro seleccionado
            const idCentroSeleccionado = data.centro_selected;
            if (!idCentroSeleccionado) {
              this.showToast('Por favor selecciona un centro', 'warning');
              return false;
            }
            
            const centro = this.centrosDisponibles.find(c => c.id_centro.toString() === idCentroSeleccionado);
            if (!centro) {
              this.showToast('Centro no encontrado', 'danger');
              return false;
            }
            
            // Preparar datos para enviar
            const nuevaCampana = {
              ...data,
              latitud: centro.latitud || -33.4489,
              longitud: centro.longitud || -70.6693,
              id_centro: centro.id_centro
            };
            
            console.log('📍 Usando centro seleccionado:', centro.nombre_centro);
            await this.enviarCampana(nuevaCampana);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  abrirSelectorMapaIntegrado(data: any) {
    const mensaje = 'Haz clic en el mapa para seleccionar una ubicación exacta para tu campaña.';
    this.showToast(mensaje, 'primary');
    
    // Cambiar cursor del mapa para indicar modo de selección
    this.map.getCanvas().style.cursor = 'crosshair';
    
    // Variable para almacenar el marcador temporal
    let marcadorTemporal: mapboxgl.Marker | null = null;
    
    const clickHandler = async (e: mapboxgl.MapMouseEvent) => {
      const lngLat = e.lngLat;
      const lat = Number(lngLat.lat.toFixed(8));
      const lng = Number(lngLat.lng.toFixed(8));
      
      // Validación geográfica para Chile
      const dentroDeChile = lng >= -76 && lng <= -66 && lat >= -56 && lat <= -17;
      if (!dentroDeChile) {
        this.showToast('Por favor selecciona un punto dentro de Chile', 'warning');
        return;
      }
      
      // Restaurar cursor normal
      this.map.getCanvas().style.cursor = '';
      
      // Limpiar marcador anterior
      if (marcadorTemporal) marcadorTemporal.remove();
      
      // Crear marcador temporal
      marcadorTemporal = new mapboxgl.Marker({ color: '#DD4B4B' })
        .setLngLat([lng, lat])
        .addTo(this.map);
      
      // Guardar ubicación seleccionada
      this.ubicacionSeleccionada = {
        lat: lat,
        lng: lng,
        tipo: 'mapa',
        descripcion: `✅ Ubicación seleccionada en mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      };
      
      // Mostrar confirmación
      this.showToast(`✅ Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
      
      // Remover el event listener
      this.map.off('click', clickHandler);
      
      // Opcional: Remover el marcador después de unos segundos
      setTimeout(() => {
        if (marcadorTemporal) {
          marcadorTemporal.remove();
          marcadorTemporal = null;
        }
      }, 3000);

      // Volver a abrir el formulario con la ubicación seleccionada
      setTimeout(() => {
        this.reabrirFormularioConUbicacion();
      }, 1000);
    };
    
    // Agregar el event listener
    this.map.on('click', clickHandler);
  }

  async reabrirFormularioConUbicacion() {
    // Volver a obtener centros del representante específico
    this.apiService.getCentrosDonacion(`representante=${this.userId}&campanas=true`).subscribe({
      next: async (res) => {
        const centrosDelRepresentante = res.data || res;
        
        // Crear opciones para el selector de centro
        const centroOptions: any[] = [];
                 if (centrosDelRepresentante && centrosDelRepresentante.length > 0) {
           centrosDelRepresentante.forEach((centro: any) => {
             const esCentroSeleccionado = this.ubicacionSeleccionada?.tipo === 'centro' && 
                                        this.ubicacionSeleccionada?.descripcion === centro.nombre_centro;
             const labelCentro = esCentroSeleccionado ? 
               `✅ ${centro.nombre_centro} (seleccionado)` : 
               centro.nombre_centro;
               
             centroOptions.push({
               type: 'radio' as const,
               label: labelCentro,
               value: `centro_${centro.id_centro}`,
               checked: esCentroSeleccionado
             });
           });
         }
        
        // Agregar opción de mapa (preseleccionada si ya se eligió)
        let mapaLabel = '📍 Seleccionar ubicación en el mapa';
        if (this.ubicacionSeleccionada?.tipo === 'mapa') {
          mapaLabel = `✅ Ubicación en mapa: ${this.ubicacionSeleccionada.lat.toFixed(6)}, ${this.ubicacionSeleccionada.lng.toFixed(6)}`;
        }
        
        centroOptions.push({
          name: 'ubicacion',
          type: 'radio' as const,
          label: mapaLabel,
          value: 'mapa',
          checked: this.ubicacionSeleccionada?.tipo === 'mapa'
        });

        const alert = await this.alertController.create({
          header: 'Crear Campaña',
          inputs: [
            {
              name: 'nombre_campana',
              type: 'text',
              placeholder: 'Nombre de la campaña',
              value: this.campanaDatos.nombre_campana || ''
            },
            {
              name: 'fecha_campana',
              type: 'date',
              placeholder: 'Fecha de inicio de la campaña',
              value: this.campanaDatos.fecha_campana || ''
            },
            {
              name: 'fecha_termino',
              type: 'date',
              placeholder: 'Fecha de término de la campaña',
              value: this.campanaDatos.fecha_termino || ''
            },
            {
              name: 'apertura',
              type: 'time',
              placeholder: 'Hora de apertura (ej: 08:00)',
              value: this.campanaDatos.apertura || ''
            },
            {
              name: 'cierre',
              type: 'time',
              placeholder: 'Hora de cierre (ej: 18:00)',
              value: this.campanaDatos.cierre || ''
            },
            {
              name: 'meta',
              type: 'text',
              placeholder: 'Meta de donaciones',
              value: this.campanaDatos.meta || ''
            },
            // Separador visual
            {
              name: 'separador',
              type: 'text',
              value: '--- UBICACIÓN ---',
              disabled: true
            },
            // Opciones de ubicación
            ...centroOptions
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
              text: 'Seleccionar en el mapa',
              handler: (data) => {
                // Guardar datos del formulario
                this.campanaDatos = data;
                // Cerrar el modal y abrir selector de mapa
                setTimeout(() => {
                  this.abrirSelectorMapaIntegrado(data);
                }, 100);
                return true; // Cerrar el alert
              }
            },
            {
              text: 'Confirmar',
          handler: async (data) => {
                console.log('📋 Datos del formulario:', data);
                
                // Buscar qué opción de ubicación fue seleccionada
                let ubicacionSeleccionada = null;
                let idCentroSeleccionado: number | null = null;
                
                // Revisar si se seleccionó un centro
                if (data.ubicacion && data.ubicacion.startsWith('centro_')) {
                  idCentroSeleccionado = parseInt(data.ubicacion.replace('centro_', ''));
                  const centroSeleccionado = this.centrosDisponibles.find(c => c.id_centro === idCentroSeleccionado);
                  if (centroSeleccionado) {
                    ubicacionSeleccionada = {
                      lat: centroSeleccionado.latitud || -33.4489,
                      lng: centroSeleccionado.longitud || -70.6693,
                      tipo: 'centro',
                      descripcion: centroSeleccionado.nombre_centro
                    };
                  }
                } else if (data.ubicacion === 'mapa') {
                  if (this.ubicacionSeleccionada?.tipo === 'mapa') {
                    ubicacionSeleccionada = this.ubicacionSeleccionada;
                  } else {
                    this.showToast('Por favor selecciona una ubicación en el mapa primero', 'warning');
                    return false;
                  }
                }
                
                // Validar que se haya seleccionado alguna ubicación
                if (!ubicacionSeleccionada) {
                  this.showToast('Por favor selecciona una ubicación', 'warning');
                  return false;
                }
                
                console.log('📍 Ubicación seleccionada:', ubicacionSeleccionada);
                
                // Preparar datos para enviar
                const nuevaCampana = {
                  ...data,
                  latitud: ubicacionSeleccionada.lat,
                  longitud: ubicacionSeleccionada.lng,
                  id_centro: idCentroSeleccionado
                };
                
                await this.enviarCampana(nuevaCampana);
                return true;
          }
        }
      ]
    });
  
    await alert.present();
      },
      error: (error) => {
        console.error('❌ Error al cargar centros:', error);
        this.showToast('Error al cargar centros', 'danger');
      }
    });
  }
  
  async mostrarSelectorCentro(dataForm1: any) {
    // Obtener solo los centros del representante actual
    this.apiService.getCentrosDonacion(`representante=${this.userId}&campanas=true`).subscribe({
      next: async (res) => {
        const centrosDelRepresentante = res.data || res;
        console.log('🏢 Centros del representante:', centrosDelRepresentante);
        
        // Si no tiene centros, ir directo al selector de mapa
        if (!centrosDelRepresentante || centrosDelRepresentante.length === 0) {
          console.log('📍 Representante sin centros, abriendo selector de mapa...');
          this.abrirSelectorMapa(dataForm1, null);
          return;
        }
        
        // Crear opciones solo con los centros del representante
        const inputOptions = centrosDelRepresentante.map((c: any) => ({
      label: c.nombre_centro,
          value: c.id_centro,
          centro: c // Guardamos el centro completo para acceder a sus coordenadas
    }));
  
    const alert = await this.alertController.create({
      header: 'Selecciona el centro',
          inputs: inputOptions.map((opt: any) => ({
        type: 'radio',
        label: opt.label,
        value: opt.value
      })),
      buttons: [
        {
          text: 'Usar ubicación del centro',
          handler: async (idCentro) => {
                // Buscar el centro seleccionado en los centros del representante
                const centroSeleccionado = centrosDelRepresentante.find((c: any) => c.id_centro === idCentro);
                if (centroSeleccionado) {
            const nuevaCampana = {
              ...dataForm1,
              id_centro: idCentro,
                    // Usar coordenadas del centro del representante
                    latitud: centroSeleccionado.latitud || -33.4489,
                    longitud: centroSeleccionado.longitud || -70.6693
            };
            await this.enviarCampana(nuevaCampana);
                } else {
                  this.showToast('Error: Centro no encontrado', 'danger');
                }
          }
        },
        {
          text: 'Seleccionar en el mapa',
          handler: async (idCentro) => {
                this.abrirSelectorMapa(dataForm1, idCentro);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
  
    await alert.present();
      },
      error: (error) => {
        console.error('❌ Error al cargar centros del representante:', error);
        this.showToast('Error al cargar centros', 'danger');
      }
    });
  }
  
  async enviarCampana(campanaData: any) {
    try {
      console.log('📤 Enviando campaña:', campanaData); // Para debug
      const response = await this.apiService.crearCampana(campanaData).toPromise();
      console.log('✅ Respuesta del servidor:', response);
      this.showToast('Campaña creada con éxito', 'success');
      
      // Recargar campañas después de crear una nueva
      this.cargarCampanasDisponibles();
      
      // Preparar marcador permanente pero no agregarlo inmediatamente
      if (campanaData.latitud && campanaData.longitud && this.map) {
        console.log('🗺️ Preparando marcador permanente para:', {
          lat: campanaData.latitud,
          lng: campanaData.longitud
        });
        
        const campanaMarker = {
          id_centro: null,
          nombre_centro: campanaData.nombre_campana,
          direccion_centro: 'Campaña móvil',
          comuna: 'Ubicación personalizada',
          telefono: '',
          fecha_creacion: '',
          created_at: '',
          id_representante: null,
          tipo: 'campana' as const,
          distancia: '0 km',
          horario_apertura: campanaData.apertura,
          horario_cierre: campanaData.cierre,
          // Usar las coordenadas exactas enviadas
          coordenadas: [campanaData.longitud, campanaData.latitud] as [number, number]
        };
        
        console.log('📍 Marcador de campaña preparado:', campanaMarker);
        
        this.donationCenters.push(campanaMarker);
        
        // Agregar el marcador permanente después de que se remueva el temporal
        setTimeout(() => {
          console.log('🔄 Agregando marcador permanente al mapa...');
          this.addMarkerToMap(campanaMarker);
          console.log('✅ Marcador permanente agregado con coordenadas:', campanaMarker.coordenadas);
        }, 3500); // Un poco después de que se remueva el temporal (3000ms + 500ms)
      }
    } catch (error) {
      console.error('❌ Error al crear campaña:', error);
      this.showToast('Error al crear campaña', 'danger');
      throw error; // Re-lanzar el error para que lo maneje abrirSelectorMapa
    }
  }
  
  abrirSelectorMapa(dataForm1: any, idCentro: number | null) {
    const mensaje = 'Haz clic en el mapa para seleccionar una ubicación exacta.';
  
    this.showToast(mensaje, 'primary');
    
    // Cambiar cursor del mapa para indicar modo de selección
    this.map.getCanvas().style.cursor = 'crosshair';
    
    // Variable para almacenar el marcador temporal
    let marcadorTemporal: mapboxgl.Marker | null = null;
    let marcadorPreciso: mapboxgl.Marker | null = null;
  
    const clickHandler = async (e: mapboxgl.MapMouseEvent) => {
      // Método 1: Coordenadas directas del evento
      const lngLat1 = e.lngLat;
      
      // Método 2: Unproject del punto exacto
      const point = e.point;
      const lngLat2 = this.map.unproject(point);
      
      // Método 3: Unproject con ajuste de pixel
      const adjustedPoint = new mapboxgl.Point(Math.round(point.x), Math.round(point.y));
      const lngLat3 = this.map.unproject(adjustedPoint);
      
      // Método 4: Coordenadas con máxima precisión usando getBounds para contexto
      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();
      
      // Calcular la resolución del pixel en metros
      const metersPerPixel = (40075016.686 * Math.cos(lngLat2.lat * Math.PI / 180)) / Math.pow(2, zoom + 8);
      
      console.log('🎯 ANÁLISIS DE PRECISIÓN:');
      console.log('  📍 Método 1 (e.lngLat):', { lat: lngLat1.lat, lng: lngLat1.lng });
      console.log('  📍 Método 2 (unproject):', { lat: lngLat2.lat, lng: lngLat2.lng });
      console.log('  📍 Método 3 (unproject ajustado):', { lat: lngLat3.lat, lng: lngLat3.lng });
      console.log('  📐 Pixel clickeado:', { x: point.x, y: point.y });
      console.log('  📐 Pixel ajustado:', { x: adjustedPoint.x, y: adjustedPoint.y });
      console.log('  🔍 Zoom actual:', zoom);
      console.log('  📏 Metros por pixel:', metersPerPixel.toFixed(2));
      
      // Usar el método más preciso (unproject ajustado)
      let lat = Number(lngLat3.lat.toFixed(12)); // 12 decimales para máxima precisión
      let lng = Number(lngLat3.lng.toFixed(12));
      
      // Validación geográfica estricta para Chile
      const dentroDeChile = lng >= -76 && lng <= -66 && lat >= -56 && lat <= -17;
      if (!dentroDeChile) {
        console.warn('❌ Coordenadas fuera del rango de Chile:', { lat, lng });
        this.showToast('Por favor selecciona un punto dentro de Chile', 'warning');
        return;
      }
      
      // Validación de precisión - si el margen es muy grande, advertir
      if (metersPerPixel > 10) {
        console.warn('⚠️ Precisión baja detectada:', metersPerPixel.toFixed(2), 'metros por pixel');
        this.showToast(`Zoom recomendado para mayor precisión (actual: ${metersPerPixel.toFixed(0)}m/pixel)`, 'warning');
      }
      
      console.log('✅ COORDENADAS FINALES:', { lat, lng });
      console.log('📊 Precisión estimada:', metersPerPixel.toFixed(2), 'metros');
      
      // Restaurar cursor normal
      this.map.getCanvas().style.cursor = '';
      
      // Limpiar marcadores anteriores
      if (marcadorTemporal) marcadorTemporal.remove();
      if (marcadorPreciso) marcadorPreciso.remove();
      
      // Crear marcador temporal grande (área de precisión)
      marcadorTemporal = new mapboxgl.Marker({ 
        color: '#00FF00',
        scale: 1.5 
      })
        .setLngLat([lng, lat])
        .addTo(this.map);
      
      // Crear marcador pequeño para el punto exacto
      marcadorPreciso = new mapboxgl.Marker({ 
        color: '#FF0000', // Rojo para el punto exacto
        scale: 0.3 
      })
        .setLngLat([lng, lat])
        .addTo(this.map);
      
      // Popup con información detallada de precisión
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        closeOnClick: false
      })
        .setLngLat([lng, lat])
        .setHTML(`
          <div style="text-align: center; font-size: 11px; max-width: 200px;">
            <h4>🎯 Ubicación Exacta</h4>
            <p><strong>Lat:</strong> ${lat}</p>
            <p><strong>Lng:</strong> ${lng}</p>
            <hr style="margin: 5px 0;">
            <p><strong>Precisión:</strong> ±${metersPerPixel.toFixed(1)}m</p>
            <p><strong>Zoom:</strong> ${zoom.toFixed(1)}x</p>
            <p><strong>Pixel:</strong> (${adjustedPoint.x}, ${adjustedPoint.y})</p>
            <hr style="margin: 5px 0;">
            <p style="color: #00AA00; font-weight: bold;">Creando campaña...</p>
            <p style="font-size: 9px; color: #666;">
              🟢 Área de precisión<br/>
              🔴 Punto exacto
            </p>
          </div>
        `)
        .addTo(this.map);
      
      // Remover el listener de clics
      this.map.off('click', clickHandler);
      
      // Crear un círculo de precisión visual
      const precisionCircle: GeoJSON.Feature<GeoJSON.Point> = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {
          radius: metersPerPixel
        }
      };
      
      // Agregar círculo de precisión al mapa
      if (this.map.getSource('precision-circle')) {
        this.map.removeLayer('precision-circle');
        this.map.removeSource('precision-circle');
      }
      
      this.map.addSource('precision-circle', {
        type: 'geojson',
        data: precisionCircle
      });
      
      this.map.addLayer({
        id: 'precision-circle',
        type: 'circle',
        source: 'precision-circle',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, metersPerPixel * 0.5] // Radio proporcional a la precisión
            ],
            base: 2
          },
          'circle-color': '#00FF00',
          'circle-opacity': 0.1,
          'circle-stroke-color': '#00FF00',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.3
        }
      });
  
      const nuevaCampana = {
        ...dataForm1,
        id_centro: idCentro,
        // Enviar coordenadas con máxima precisión
        latitud: lat,
        longitud: lng,
        // Agregar metadatos de precisión para debugging
        precision_meters: metersPerPixel,
        zoom_level: zoom,
        pixel_coords: { x: adjustedPoint.x, y: adjustedPoint.y }
      };
      
      console.log('📤 ENVIANDO CAMPAÑA CON MÁXIMA PRECISIÓN:', nuevaCampana);

      try {
      await this.enviarCampana(nuevaCampana);
        
        // Remover elementos visuales después del éxito
        setTimeout(() => {
          marcadorTemporal?.remove();
          marcadorPreciso?.remove();
          popup.remove();
          
          // Remover círculo de precisión
          if (this.map.getLayer('precision-circle')) {
            this.map.removeLayer('precision-circle');
            this.map.removeSource('precision-circle');
          }
        }, 4000); // Mantener visible 4 segundos para verificar
        
      } catch (error) {
        // En caso de error, mantener elementos para debugging
        if (marcadorTemporal) {
          marcadorTemporal.remove();
          marcadorTemporal = new mapboxgl.Marker({ 
            color: '#FF0000',
            scale: 1.0 
          })
            .setLngLat([lng, lat])
            .addTo(this.map);
          
          if (marcadorPreciso) marcadorPreciso.remove();
          
          popup.setHTML(`
            <div style="text-align: center; font-size: 11px;">
              <h4>❌ Error</h4>
              <p>No se pudo crear la campaña</p>
              <p><strong>Lat:</strong> ${lat}</p>
              <p><strong>Lng:</strong> ${lng}</p>
              <p><strong>Precisión:</strong> ±${metersPerPixel.toFixed(1)}m</p>
              <p style="font-size: 10px; color: #666;">Las coordenadas eran correctas</p>
            </div>
          `);
          
          setTimeout(() => {
            marcadorTemporal?.remove();
            popup.remove();
            if (this.map.getLayer('precision-circle')) {
              this.map.removeLayer('precision-circle');
              this.map.removeSource('precision-circle');
            }
          }, 8000);
        }
        
        console.error('❌ Error al crear campaña:', error);
      }
    };
  
    this.map.once('click', clickHandler);
    
    // Mostrar información de precisión actual
    const currentZoom = this.map.getZoom();
    const currentCenter = this.map.getCenter();
    const currentMetersPerPixel = (40075016.686 * Math.cos(currentCenter.lat * Math.PI / 180)) / Math.pow(2, currentZoom + 8);
    
    console.log('📊 ESTADO ACTUAL DEL MAPA:');
    console.log('  🔍 Zoom:', currentZoom.toFixed(2));
    console.log('  📏 Precisión actual:', currentMetersPerPixel.toFixed(2), 'metros por pixel');
    console.log('  📍 Centro:', { lat: currentCenter.lat.toFixed(6), lng: currentCenter.lng.toFixed(6) });
    
    if (currentMetersPerPixel > 5) {
      this.showToast(`💡 Haz zoom para mayor precisión (actual: ${currentMetersPerPixel.toFixed(0)}m)`, 'primary');
    }
    
    // Timeout de seguridad
    setTimeout(() => {
      if (this.map.getCanvas().style.cursor === 'crosshair') {
        this.map.getCanvas().style.cursor = '';
        this.map.off('click', clickHandler);
        this.showToast('Selección de ubicación cancelada por timeout', 'warning');
      }
    }, 120000); // 2 minutos
  }
  
  private async verificarRutaGuardada() {
    console.log('🔍 Verificando ruta guardada...');
    const rutaStr = localStorage.getItem('ruta_actual');
    console.log('📦 Contenido de localStorage:', rutaStr);
  
    if (!rutaStr || !this.map) {
      console.warn('❌ No hay ruta guardada o el mapa no está inicializado');
      return;
    }
  
    // Esperar hasta que currentLocation esté disponible (máximo 2 segundos)
    let retries = 0;
    while (!this.currentLocation && retries < 20) {
      console.log('⏳ Esperando ubicación actual...', retries);
      await new Promise(res => setTimeout(res, 100));
      retries++;
    }

    if (!this.currentLocation) {
      console.warn('❌ No se pudo obtener la ubicación actual después de varios intentos');
      return;
    }
  
    try {
      const ruta = JSON.parse(rutaStr);
      console.log('📍 Ruta parseada:', ruta);
      const { destino, nombreCentro, geometry, distance } = ruta;
  
      // Validar que destino es un arreglo con 2 números
      if (!Array.isArray(destino) || destino.length !== 2) {
        console.warn('🚫 Destino inválido (no es [lng, lat]):', destino);
        localStorage.removeItem('ruta_actual');
        return;
      }
  
      const [lng, lat] = destino.map(coord => parseFloat(coord));
      console.log('🎯 Coordenadas de destino parseadas:', { lng, lat });
  
      // Validar que las coordenadas son números válidos
      if (isNaN(lng) || isNaN(lat)) {
        console.warn('🚫 Coordenadas no son números válidos:', { lng, lat });
        localStorage.removeItem('ruta_actual');
        return;
      }
  
      // Verificar si está dentro del rango de Chile (rangos más amplios para ser más permisivos)
      const dentroDeChile = lng >= -110 && lng <= -60 && lat >= -60 && lat <= -10;
      if (!dentroDeChile) {
        console.warn('❌ Coordenadas fuera de Chile:', { lng, lat });
        this.showToast('Ubicación inválida. No se puede mostrar la ruta.', 'warning');
        localStorage.removeItem('ruta_actual');
        return;
      }
  
      // Centrar mapa
      console.log('🗺️ Centrando mapa en destino...');
      this.map.flyTo({
        center: [lng, lat] as [number, number],
        zoom: 15
      });

      // Dibujar la ruta en el mapa
      if (geometry) {
        console.log('🎨 Dibujando ruta en el mapa...');
        // Remover ruta anterior si existe
        if (this.map.getLayer('route')) {
          console.log('🧹 Removiendo capa de ruta anterior...');
          this.map.removeLayer('route');
        }
        if (this.map.getSource('route')) {
          console.log('🧹 Removiendo fuente de ruta anterior...');
          this.map.removeSource('route');
        }

        // Agregar nueva ruta
        console.log('➕ Agregando nueva fuente de ruta...');
        this.map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: geometry
          }
        });

        console.log('➕ Agregando nueva capa de ruta...');
        this.map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#DD4B4B',
            'line-width': 4
          }
        });

        console.log('🧹 Limpiando localStorage...');
        localStorage.removeItem('ruta_actual');
        console.log('✅ Ruta dibujada exitosamente');
      } else {
        console.warn('⚠️ No se encontró geometría en la ruta guardada');
        this.showToast('Error al mostrar la ruta', 'danger');
      }
  
      // Mensaje visual
      this.showToast(`Mostrando ruta hacia: ${nombreCentro} (${distance.toFixed(1)} km)`, 'primary');
    } catch (err) {
      console.error('❌ Error leyendo ruta almacenada:', err);
      localStorage.removeItem('ruta_actual');
    }
  }
  
  
  private async esperarYVerificarRutaGuardada() {
    console.log('⏳ Esperando para verificar ruta guardada...');
    let retries = 0;
  
    while ((!this.map || !this.currentLocation || this.donationCenters.length === 0) && retries < 30) {
      await new Promise(res => setTimeout(res, 100));
      retries++;
    }
  
    if (!this.map || !this.currentLocation) {
      console.warn("❌ No se puede mostrar la ruta: ubicación o mapa no disponibles");
      return;
    }
  
    console.log('✅ Condiciones listas, verificando ruta...');
    this.verificarRutaGuardada();
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
      await this.showToast(`QR recibido: ${data.substring(0, 50)}...`, 'warning');
      try {
        const scannedData = JSON.parse(data);
        await this.showToast(`QR parseado: ${scannedData.rut || 'Sin RUT'}`, 'warning');
  
        const lugarSeleccionado = localStorage.getItem('lugarDonacionSeleccionado');
  
        if (!lugarSeleccionado) {
          this.showToast('⚠️ Debe seleccionar un lugar de donación primero', 'warning');
          return;
        }
  
        const lugar = JSON.parse(lugarSeleccionado);
        const donacionData: any = {
          rut: scannedData.rut,
          tipo_donacion: lugar.tipo
        };
        
        // Solo enviar centro_id si existe
          if (lugar.centro_id) {
          donacionData.centro_id = lugar.centro_id;
        }
        
        // Agregar IDs específicos según el tipo
        if (lugar.tipo === 'campana' && lugar.campana_id) {
          donacionData.campana_id = lugar.campana_id;
        } else if (lugar.tipo === 'solicitud' && lugar.solicitud_id) {
          donacionData.solicitud_id = lugar.solicitud_id;
        }
  
        this.apiService.guardarDonacionQR(donacionData).subscribe({
          next: () => {
            this.showToast('✅ Donación registrada exitosamente', 'success');
            localStorage.removeItem('lugarDonacionSeleccionado');
          },
          error: (error) => {
            let errorMessage = 'Error al registrar la donación';
            if (error.status === 400) errorMessage = 'Datos inválidos. Verifique la información.';
            else if (error.status === 401) errorMessage = 'No autorizado. Inicie sesión nuevamente.';
            else if (error.status === 403) errorMessage = 'Solo representantes pueden registrar donaciones por QR.';
            else if (error.status === 404) errorMessage = 'Donante o centro no encontrado.';
            else if (error.status === 500) errorMessage = 'Error del servidor. Intente más tarde.';
            this.showToast(`❌ ${errorMessage}`, 'danger');
          }
        });
      } catch (e) {
        this.showToast('❌ QR inválido o mal formateado', 'danger');
      }
    } else {
      this.showToast('ℹ️ Escaneo cancelado', 'medium');
    }
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
    
    // Si el valor es 0 o muy cerca de 0, usar Santiago por defecto
    if (Math.abs(value) < 0.0001) {
      console.log(`⚠️ Coordenada ${type} es 0 o muy pequeña (${value}), usando Santiago por defecto`);
      return santiagoDef;
    }
    
    // Si ya está en rango válido de Chile, devolver tal como está
    if (value >= expectedRange.min && value <= expectedRange.max) {
      console.log(`✅ Coordenada ${type} ya válida: ${value}`);
      return value;
    }
    
    // Si es un entero muy grande (escalado), dividir por 1,000,000
    if (Math.abs(value) > 1000) {
      const scaled = value / 1000000;
      console.log(`🔄 Coordenada ${type} escalada: ${value} -> ${scaled}`);
      if (scaled >= expectedRange.min && scaled <= expectedRange.max) {
        return scaled;
      } else {
        console.warn(`⚠️ Coordenada ${type} escalada fuera de rango: ${scaled}, usando Santiago`);
        return santiagoDef;
      }
    }
    
    // Si es un valor fuera de rango y no es escalado, usar Santiago por defecto
    console.warn(`⚠️ Coordenada ${type} fuera de rango: ${value}, usando Santiago por defecto`);
    return santiagoDef;
  }

  

}
