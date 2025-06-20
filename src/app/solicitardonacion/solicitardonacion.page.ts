import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { GeocodingService } from '../services/geocoding.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-Solicitardonacion',
  templateUrl: './Solicitardonacion.page.html',
  styleUrls: ['./Solicitardonacion.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, ReactiveFormsModule, CommonModule]
})
export class SolicitardonacionPage {
  centros: any[] = [];

  formulario = {
    tipo_sangre_sol: '',
    cantidad_personas: '',
    descripcion_solicitud: '',
    comuna_solicitud: '',
    ciudad_solicitud: '',
    region_solicitud: '',
    centro_donacion: '',
    fecha_solicitud: '',
    fecha_termino: '',
    apertura: '',
    cierre: ''
  };

  constructor(
    private api: ApiService,
    private geocodingService: GeocodingService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargarCentros();
    // Verificar endpoints disponibles para debugging
    this.verificarEndpoints();
  }

  cargarCentros() {
    this.api.getCentrosDonacion().subscribe({
      next: (response) => {
        console.log('Respuesta centros:', response);
        // El backend retorna {status: "success", count: number, data: centros[]}
        if (response.status === 'success' && response.data) {
          this.centros = response.data;
        } else {
          this.centros = response; // En caso de que la estructura sea diferente
        }
      },
      error: async (error) => {
        console.error('Error al cargar centros:', error);
        const toast = await this.toastCtrl.create({
          message: 'Error al cargar los centros de donación',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  verificarEndpoints() {
    console.log('🔍 Verificando endpoints disponibles...');
    this.api.verificarEndpointsSolicitudes().subscribe({
      next: (response) => {
        console.log('✅ Respuesta de solicitudes:', response);
      },
      error: (error) => {
        console.error('❌ Error al verificar endpoints:', error);
      }
    });
  }

  async publicarSolicitud() {
    try {
      // Verificar autenticación
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      if (!token) {
        const toast = await this.toastCtrl.create({
          message: 'Debe iniciar sesión para enviar una solicitud',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
        return;
      }

      if (!userId) {
        const toast = await this.toastCtrl.create({
          message: 'Error: No se pudo identificar al usuario. Inicie sesión nuevamente.',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
        return;
      }

      // Validación básica del formulario
      if (!this.formulario.tipo_sangre_sol || !this.formulario.cantidad_personas || 
          !this.formulario.descripcion_solicitud || !this.formulario.centro_donacion ||
          !this.formulario.fecha_solicitud || !this.formulario.fecha_termino) {
        const toast = await this.toastCtrl.create({
          message: 'Por favor complete todos los campos requeridos',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
        return;
      }

      // Ya no validamos apertura/cierre porque el backend los obtiene automáticamente del centro

      // Validar que se haya obtenido la ubicación del centro
      if (!this.formulario.comuna_solicitud) {
        const toast = await this.toastCtrl.create({
          message: 'Error: No se pudo obtener la ubicación del centro seleccionado',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
        return;
      }

      // Validar cantidad personas (entre 1 y 100)
      const cantidadPersonas = parseInt(this.formulario.cantidad_personas);
      if (cantidadPersonas < 1 || cantidadPersonas > 100) {
        const toast = await this.toastCtrl.create({
          message: 'La cantidad de personas debe ser entre 1 y 100',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
        return;
      }

      // Validar fechas - permitir crear campañas para hoy
      const fechaSolicitudStr = this.formulario.fecha_solicitud; // "2024-12-28"
      const fechaTerminoStr = this.formulario.fecha_termino;
      const fechaActualStr = new Date().toISOString().split('T')[0]; // "2024-12-28"
      
      if (fechaSolicitudStr < fechaActualStr) {
        const toast = await this.toastCtrl.create({
          message: 'La fecha de inicio no puede ser anterior a hoy',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
        return;
      }

      if (fechaTerminoStr <= fechaSolicitudStr) {
        const toast = await this.toastCtrl.create({
          message: 'La fecha de término debe ser posterior a la fecha de inicio',
          duration: 3000,
          color: 'warning'
        });
        toast.present();
        return;
      }

      // Logs para debugging
      console.log('📝 Formulario original:', this.formulario);
      console.log('🏥 Centros disponibles:', this.centros);
      
      // Preparar datos para envío con formato correcto
      const solicitudData = {
        tipo_sangre_sol: this.formulario.tipo_sangre_sol,
        cantidad_personas: cantidadPersonas,
        descripcion_solicitud: this.formulario.descripcion_solicitud.trim(),
        comuna_solicitud: this.formulario.comuna_solicitud.trim(),
        ciudad_solicitud: this.formulario.ciudad_solicitud.trim(),
        region_solicitud: this.formulario.region_solicitud.trim(),
        centro_donacion: parseInt(this.formulario.centro_donacion),
        // Usar fechas directamente desde el formulario (ya están en formato YYYY-MM-DD)
        fecha_solicitud: fechaSolicitudStr,
        fecha_termino: fechaTerminoStr
      };
      
      console.log('📤 Datos a enviar:', solicitudData);
      console.log('📤 Datos en formato JSON:', JSON.stringify(solicitudData, null, 2));
      console.log('🔑 Token de autenticación:', localStorage.getItem('authToken') ? 'Presente' : 'Ausente');
      
      const res = await this.api.crearSolicitudCampana(solicitudData).toPromise();
      
      console.log('✅ Respuesta exitosa:', res);
      
      // Limpiar formulario después del éxito
      this.formulario = {
        tipo_sangre_sol: '',
        cantidad_personas: '',
        descripcion_solicitud: '',
        comuna_solicitud: '',
        ciudad_solicitud: '',
        region_solicitud: '',
        centro_donacion: '',
        fecha_solicitud: '',
        fecha_termino: '',
        apertura: '',
        cierre: ''
      };

      const toast = await this.toastCtrl.create({
        message: 'Solicitud enviada con éxito',
        duration: 2000,
        color: 'success'
      });
      toast.present();
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('📊 Status del error:', error.status);
      console.error('📝 Mensaje del error:', error.message);
      console.error('🔍 Detalles del error:', error.error);
      console.error('🌐 URL del error:', error.url);
      console.error('📋 Headers de respuesta:', error.headers);
      
      let errorMessage = 'Error al enviar solicitud';
      
      if (error.status === 500) {
        errorMessage = 'Error interno del servidor. Por favor inténtelo nuevamente o contacte al administrador.';
        console.error('🚨 Error 500: Problema en el servidor Django');
      } else if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor inicie sesión nuevamente.';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para realizar esta acción.';
      } else if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error && typeof error.error === 'object') {
        // Si hay errores de validación específicos por campo
        const errors = Object.keys(error.error).map(key => {
          if (Array.isArray(error.error[key])) {
            return `${key}: ${error.error[key].join(', ')}`;
          }
          return `${key}: ${error.error[key]}`;
        });
        errorMessage = errors.join('; ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const toast = await this.toastCtrl.create({
        message: errorMessage,
        duration: 4000,
        color: 'danger'
      });
      toast.present();
    }
  }

  // Getter para la fecha mínima (hoy)
  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Función para actualizar ubicación cuando se selecciona un centro
  async onCentroSeleccionado() {
    const centroSeleccionado = this.centros.find(centro => 
      centro.id_centro == this.formulario.centro_donacion
    );
    
    if (centroSeleccionado) {
      console.log('🏥 Centro seleccionado:', centroSeleccionado.nombre_centro);
      console.log('📍 Dirección del centro:', centroSeleccionado.direccion_centro);
      console.log('🏛️ Comuna en BD (IGNORAR):', centroSeleccionado.comuna);
      
      // IGNORAR la comuna de la BD y calcular la correcta basándose en la dirección
      try {
        // Obtener coordenadas de la dirección del centro
        const coordenadas = await this.geocodingService.getCoordinates(centroSeleccionado.direccion_centro);
        
        if (coordenadas && coordenadas[0] !== 0 && coordenadas[1] !== 0) {
          console.log('📍 Coordenadas obtenidas:', coordenadas);
          
          // Obtener la información real de ubicación basándose en las coordenadas
          const locationInfo = await this.geocodingService.getReverseGeocode(coordenadas);
          
          if (locationInfo) {
            console.log('✅ Ubicación real calculada:', locationInfo);
            
            // Usar la comuna REAL calculada, no la de la BD
            this.formulario.comuna_solicitud = locationInfo.comuna || 'Comuna no identificada';
            // Extraer la ciudad de la dirección del centro
            this.formulario.ciudad_solicitud = this.extractCityFromAddress(centroSeleccionado.direccion_centro);
            this.formulario.region_solicitud = locationInfo.region || 'Región Metropolitana';
            
            console.log('📍 Ubicación final actualizada:', {
              comuna: this.formulario.comuna_solicitud,
              ciudad: this.formulario.ciudad_solicitud,
              region: this.formulario.region_solicitud
            });
          } else {
            console.warn('⚠️ No se pudo obtener información de ubicación');
            this.setDefaultLocation(centroSeleccionado);
          }
        } else {
          console.warn('⚠️ Coordenadas inválidas obtenidas');
          this.setDefaultLocation(centroSeleccionado);
        }
      } catch (error) {
        console.error('❌ Error obteniendo ubicación:', error);
        this.setDefaultLocation(centroSeleccionado);
      }
    }
  }
  
  private setDefaultLocation(centro: any) {
    console.log('🔄 Usando ubicación por defecto para:', centro.nombre_centro);
    
    // Extraer información básica de la dirección como fallback
    if (centro.direccion_centro) {
      const direccionParts = centro.direccion_centro.split(',');
      
      // Buscar patrones conocidos en la dirección
      let comunaExtraida = 'Comuna no identificada';
      let ciudadExtraida = 'Santiago';
      let regionExtraida = 'Región Metropolitana';
      
      // Buscar comuna en la dirección
      for (const part of direccionParts) {
        const partTrimmed = part.trim().toLowerCase();
        if (partTrimmed.includes('la reina')) {
          comunaExtraida = 'La Reina';
          break;
        } else if (partTrimmed.includes('santiago')) {
          comunaExtraida = 'Santiago';
          break;
        } else if (partTrimmed.includes('providencia')) {
          comunaExtraida = 'Providencia';
          break;
        }
        // Agregar más comunas según sea necesario
      }
      
      this.formulario.comuna_solicitud = comunaExtraida;
      this.formulario.ciudad_solicitud = this.extractCityFromAddress(centro.direccion_centro);
      this.formulario.region_solicitud = regionExtraida;
    } else {
      // Si no hay dirección, usar valores por defecto
      this.formulario.comuna_solicitud = 'Comuna no identificada';
      this.formulario.ciudad_solicitud = 'Ciudad no identificada';
      this.formulario.region_solicitud = 'Región no identificada';
    }
    
    console.log('📍 Ubicación por defecto asignada:', {
      comuna: this.formulario.comuna_solicitud,
      ciudad: this.formulario.ciudad_solicitud,
      region: this.formulario.region_solicitud
    });
  }

  private extractCityFromAddress(direccion: string): string {
    if (!direccion) return 'Ciudad no identificada';
    
    console.log('🔍 Extrayendo ciudad de la dirección:', direccion);
    
    // Dividir la dirección por comas
    const parts = direccion.split(',').map(part => part.trim());
    
    // Buscar patrones conocidos de ciudades chilenas
    const ciudadesChilenas = [
      'Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta',
      'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán', 'Iquique', 'Los Ángeles',
      'Puerto Montt', 'Valdivia', 'Osorno', 'Quillota', 'Ovalle', 'Curicó', 'Linares'
    ];
    
    // Buscar si alguna parte contiene una ciudad conocida
    for (const part of parts) {
      for (const ciudad of ciudadesChilenas) {
        if (part.toLowerCase().includes(ciudad.toLowerCase())) {
          console.log(`✅ Ciudad encontrada: ${ciudad} en "${part}"`);
          return ciudad;
        }
      }
    }
    
    // Si la dirección contiene "Región Metropolitana", asumir Santiago
    if (direccion.toLowerCase().includes('región metropolitana') || 
        direccion.toLowerCase().includes('region metropolitana')) {
      console.log('✅ Región Metropolitana detectada → Santiago');
      return 'Santiago';
    }
    
    // Si no se encuentra una ciudad específica, usar la penúltima parte como posible ciudad
    if (parts.length >= 2) {
      const posibleCiudad = parts[parts.length - 2];
      // Filtrar códigos postales y textos que no parecen ciudades
      if (!/^\d+$/.test(posibleCiudad) && posibleCiudad.length > 2) {
        console.log(`📍 Usando posible ciudad: ${posibleCiudad}`);
        return posibleCiudad;
      }
    }
    
    console.log('⚠️ No se pudo determinar la ciudad, usando valor por defecto');
    return 'Ciudad no identificada';
  }
}
