import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DonationCenter } from '../interfaces/donation-center.interface';
import { Observable, map, catchError, throwError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DonationCentersService {
  private apiUrl = 'https://bloodpoint-core-qa-35c4ecec4a30.herokuapp.com/centros';
  private cache: DonationCenter[] | null = null;

  constructor(private http: HttpClient) {}

  getCenters(): Observable<DonationCenter[]> {
    if (this.cache) {
      return of(this.cache); // Retorna los datos desde el cache si ya están almacenados
    }

    return this.http.get<{data: any[]}>(this.apiUrl).pipe(
      map(response => {
        // Transforma los centros a la estructura deseada y los guarda en cache
        this.cache = response.data.map(center => this.transformCenter(center));
        return this.cache;
      }),
      catchError(error => {
        console.error('Error fetching centers:', error);
        return throwError(() => new Error('Error al cargar centros'));
      })
    );
  }

  getCenterById(id: number): Observable<DonationCenter> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.transformCenter(response)),
      catchError(error => {
        console.error('Error fetching center:', error);
        return throwError(() => new Error('Error al cargar centro'));
      })
    );
  }

  createDonationCenter(centerData: any): Observable<DonationCenter> {
    return this.http.post<{data: any}>(`${this.apiUrl}`, centerData).pipe(
      map(response => {
        // Al agregar un nuevo centro, lo transforma y lo agrega al cache
        const newCenter = this.transformCenter(response.data);
        this.cache = this.cache ? [...this.cache, newCenter] : [newCenter];
        return newCenter;
      }),
      catchError(error => {
        console.error('Error creating donation center:', error);
        return throwError(() => new Error('Error al crear el centro de donación'));
      })
    );
  }

  private transformCenter(apiCenter: any): DonationCenter {
    // Transforma los datos recibidos de la API a la estructura esperada
    return {
      id_centro: apiCenter.id_centro,
      nombre_centro: apiCenter.nombre_centro,
      direccion_centro: apiCenter.direccion_centro,
      comuna: apiCenter.comuna,
      telefono: apiCenter.telefono,
      fecha_creacion: apiCenter.fecha_creacion,
      created_at: apiCenter.created_at,
      id_representante: apiCenter.id_representante,
      distancia: 'No disponible',
      tipo: apiCenter.tipo || 'punto' // ✅ Agrega esta línea
    };
    
  }
}
