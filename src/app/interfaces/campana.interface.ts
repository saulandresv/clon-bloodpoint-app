export interface CampanaActiva {
    id_campana: number;
    fecha_campana: string;
    fecha_termino: string;
    apertura: string;
    cierre: string;
    meta: string;
    latitud: string;
    longitud: string;
    id_centro: number | null;
    centro: string | null;
    id_solicitud: number | null;
    validada: boolean;
    estado: string;
    nombre_campana?: string;
  tipo_sangre_sol?: string; // Añadir tipo de sangre para solicitudes
  cantidad_personas?: number; // Añadir cantidad para solicitudes
  descripcion_solicitud?: string; // Añadir descripción para solicitudes
}
  