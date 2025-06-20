export interface Donante {
    id_donante: number;
    rut: string;
    nombre_completo: string;
    email: string;
    contrasena: string;
    direccion: string;
    comuna: string;
    fono: string;
    fecha_nacimiento: string;
    nacionalidad: string;
    tipo_sangre: string;
    dispo_dia_donacion: string;
    nuevo_donante: boolean;
    noti_emergencia: boolean;
    ocupacion: string;
  }
