export interface DonacionHistorial {
  id: number;
  fecha_donacion: string;
  cantidad_donacion?: number;
  volumen?: number;
  tipo_sangre?: string;
  tipo_sangre_donante?: string;
  tipo_donacion?: string;
  motivo?: string;
  
  // Información del centro
  centro?: string;
  centro_nombre?: string;
  centro_direccion?: string;
  nombre_contexto?: string;
  centro_donacion?: {
    id: number;
    nombre: string;
    direccion: string;
    telefono?: string;
  };
  
  // Información adicional
  observaciones?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HistorialDonacionesResponse {
  donaciones: DonacionHistorial[];
  total?: number;
  mensaje?: string;
} 