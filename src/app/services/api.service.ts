import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DonanteFormulario } from '../interfaces/donante-formulario';
import { Donante } from '../interfaces/donante-backend';
import { LoginCredentials, LoginResponse } from '../interfaces/login';
import { HistorialDonacionesResponse, DonacionHistorial } from '../interfaces/donacion-historial.interface';
import { HttpHeaders } from '@angular/common/http'; 
import { CampanaActiva } from '../interfaces/campana.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // GET /donantes - Obtener todos los donantes
  getDonantes(): Observable<Donante[]> { 
    return this.http.get<Donante[]>(`${this.API_URL}/donantes/`);
  }

  // GET /donantes/:id - Obtener un donante específico
  getDonante(id: number): Observable<Donante> {
    return this.http.get<Donante>(`${this.API_URL}/donantes/${id}/`);
  }

  // POST /donantes - Crear nuevo donante
  crearDonante(donante: DonanteFormulario): Observable<Donante> {
    return this.http.post<Donante>(`${this.API_URL}/donantes/`, donante);
  }

  // PUT /donantes/:id - Actualizar donante
  actualizarDonante(id: number, donante: Donante): Observable<Donante> {
    return this.http.put<Donante>(`${this.API_URL}/donantes/${id}/`, donante);
  }

  // DELETE /donantes/:id - Eliminar donante
  eliminarDonante(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/donantes/${id}/`);
  }

  // POST /donaciones - Registrar nueva donación
  registrarDonacion(donacion: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/donaciones/`, donacion);
  }

  // POST /auth/login - Iniciar sesión
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    console.log('Attempting login with:', credentials);
  
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
  
    return this.http.post<LoginResponse>(
      `${this.API_URL}/ingresar/`,
      credentials,
      { headers } // <-- Aquí se agregan los headers
    ).pipe(
      catchError(this.handleError)
    );
  }

  // GET /donantes - Test connection
  testConnection(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.API_URL}/donantes`);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => errorMessage);
  }

  registrarUsuario(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register/`, data).pipe(
      catchError(this.handleError)
    );
  }
  
  getPerfilUsuario(): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });
    return this.http.get(`${this.API_URL}/profile/`, { headers });
  }
  
  actualizarPerfilUsuario(data: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });
    return this.http.put(`${this.API_URL}/profile/`, data, { headers });
  }

  registrarDonacionDesdeCentro(donacion: {
    centro_id: number;
    fecha_donacion: string;
    cantidad_donacion: number;
  }): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.post(`${this.API_URL}/donaciones/registrar/`, donacion, { headers });
  }
  
  getHistorialDonaciones(): Observable<HistorialDonacionesResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    return this.http.get<HistorialDonacionesResponse>(`${this.API_URL}/donaciones/historial/`, { headers }).pipe(
      tap(response => {
        console.log('📋 Respuesta del historial:', response);
      }),
      catchError(error => {
        console.error('❌ Error en historial:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_id');
  }

  guardarDonacion(donacionData: any) {
    return this.http.post(`${this.API_URL}/donaciones`, donacionData);
  }

  getCampanasRepresentante() {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    // Usar el endpoint correcto que existe en las URLs de Django
    return this.http.get<any[]>(`${this.API_URL}/api/campanas_activas_representante/`, { headers });
  }  
  
  guardarDonacionQR(donacionData: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.API_URL}/donaciones/qr/`, donacionData, { headers });
  }

  crearCampana(campanaData: any) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    };
    return this.http.post(`${this.API_URL}/campanas/crear/`, campanaData, { headers });
  }

  validarCampana(campana_id: any) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    };
    return this.http.put(`${this.API_URL}/campanas/${campana_id}/`,{}, { headers });
  }
  
  // Método para obtener centros de donación
  getCentrosDonacion(filters: string = ''): Observable<any> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No hay token de autenticación');
      return throwError(() => new Error('No hay token de autenticación'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    
    console.log('Enviando petición con token:', token.substring(0, 10) + '...');
    return this.http.get(`${this.API_URL}/centros?${filters}`, { headers }).pipe(
      tap(response => {
        console.log('Respuesta completa:', response);
      }),
      catchError(error => {
        console.error('Error al obtener centros:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Método para obtener campañas activas
  getCampanasActivas(): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.get(`${this.API_URL}/campanas/activas/`, { headers }).pipe(
      catchError(error => {
        console.error('Error al obtener campañas activas:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Método de prueba para verificar endpoints disponibles
  verificarEndpointsSolicitudes(): Observable<any> {
    console.log('🔍 Verificando endpoints de solicitudes...');
    
    // Intentar el endpoint base de solicitudes
    return this.http.get(`${this.API_URL}/solicitudes/`).pipe(
      tap(response => {
        console.log('✅ Endpoint /solicitudes/ disponible:', response);
      }),
      catchError(error => {
        console.error('❌ Error en /solicitudes/:', error);
        throw error;
      })
    );
  }

  crearSolicitudCampana(data: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token para solicitud:', token ? `${token.substring(0, 10)}...` : 'No disponible');
    console.log('📤 URL de solicitud:', `${this.API_URL}/solicitudes/crear/`);
    console.log('📋 Datos a enviar:', data);
    
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('📋 Headers enviados:', headers.keys());
  
    return this.http.post(`${this.API_URL}/solicitudes/crear/`, data, { headers }).pipe(
      tap(response => {
        console.log('✅ Respuesta exitosa del servidor:', response);
      }),
      catchError(error => {
        console.error('❌ Error en crearSolicitudCampana:', error);
        console.error('❌ Status del error:', error.status);
        console.error('❌ Mensaje del error:', error.message);
        console.error('❌ Error completo:', error.error);
        throw error;
      })
    );
  }
  /**
   * GET /archivements - Obtener logros del usuario autenticado
   */
  getAchievements(): Observable<any[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<any[]>(`${this.API_URL}/achievements/`, { headers });
  }

  // Device Token Management Methods
  
  /**
   * POST /device-tokens/register/ - Register device FCM token
   */
  registerDeviceToken(data: { token: string; device_type: string; device_id?: string }): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.API_URL}/device-tokens/register/`, data, { headers });
  }

  /**
   * DELETE /device-tokens/unregister/ - Unregister device FCM token
   */
  unregisterDeviceToken(data: { token: string }): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.request('DELETE', `${this.API_URL}/device-tokens/unregister/`, { 
      headers, 
      body: data 
    });
  }

  /**
   * GET /device-tokens/ - Get user's active device tokens
   */
  getUserDeviceTokens(): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get(`${this.API_URL}/device-tokens/`, { headers });
  }

  /**
   * POST /notifications/test/ - Send test notification
   */
  sendTestNotification(data: { title?: string; body?: string }): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.API_URL}/notifications/test/`, data, { headers });
  }

  /**
   * GET /achievements/unnotified/ - Get unnotified achievements
   */
  getUnnotifiedAchievements(): Observable<any[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<any[]>(`${this.API_URL}/achievements/unnotified/`, { headers });
  }

  /**
   * POST /achievements/mark-notified/ - Mark achievements as notified
   */
  markAchievementsAsNotified(achievementIds: number[]): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.API_URL}/achievements/mark-notified/`, { 
      achievement_ids: achievementIds 
    }, { headers });
  }

  /**
   * POST /record-app-share - Registrar que el usuario compartió la app/donación
   */
  registrarCompartir(): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.API_URL}/record-app-share/`, {}, { headers }).pipe(
      tap(response => {
        console.log('✅ Compartir registrado:', response);
      }),
      catchError(error => {
        console.error('❌ Error al registrar compartir:', error);
        return throwError(() => error);
      })
    );
  }


}
