import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { KeyboardService } from '../services/keyboard.service';
import { CommonModule } from '@angular/common';
import { DonanteFormulario } from '../interfaces/donante-formulario';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrarse',
  templateUrl: './registrarse.page.html',
  styleUrls: ['./registrarse.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule],
})
export class RegistrarsePage implements OnInit, OnDestroy {
  formData: Partial<DonanteFormulario> & { password?: string, repetirPassword?: string, rut?: string, direccion?: string, comuna?: string, ocupacion?: string } = {
    rut: '',
    nombreCompleto: '',
    correoElectronico: '',
    fechaNacimiento: '',
    tipoSangre: '',
    telefono: '',
    sexo: 'H',
    nuevoDonante: true,
    aceptaTerminos: false,
    recibirNotificaciones: false,
    password: '',
    repetirPassword: '',
    direccion: '',
    comuna: '',
    ocupacion: ''
  };

  constructor(
    private apiService: ApiService,
    private toastController: ToastController,
    private router: Router,
    private keyboardService: KeyboardService
  ) {}

  validarRut(rut: string): boolean {
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    if (rut.length < 2) return false;
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    let suma = 0;
    let multiplo = 2;
  
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i)) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
  
    const dvEsperado = 11 - (suma % 11);
    const dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
    return dv === dvFinal;
  }

  formatearRut(valor: string) {
    const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (limpio.length < 2) {
      this.formData.rut = limpio;
      return;
    }
  
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    let cuerpoFormateado = cuerpo;
    if (cuerpo.length >= 4) {
      cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  
    this.formData.rut = `${cuerpoFormateado}-${dv}`;
  }

  esMayorDeEdad(fecha: string): boolean {
    const fechaNacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad >= 18;
  }
  
  esCorreoValido(correo: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  }

  async registrarDonante(formValue: any) {
    if (!formValue.rut || !this.validarRut(formValue.rut)) {
      await this.showToast('El RUT ingresado no es válido', 'warning');
      return;
    }

    if (!formValue.password || formValue.password.length < 8) {
      await this.showToast('La contraseña debe tener al menos 8 caracteres', 'warning');
      return;
    }

    if (formValue.password !== formValue.repetirPassword) {
      await this.showToast('Las contraseñas no coinciden', 'warning');
      return;
    }

    if (!this.esMayorDeEdad(formValue.fechaNacimiento)) {
      await this.showToast('Debes ser mayor de 18 años para registrarte', 'warning');
      return;
    }

    if (!formValue.aceptaTerminos) {
      await this.showToast('Debe aceptar los términos y condiciones', 'warning');
      return;
    }

    const nuevoDonante = {
      rut: formValue.rut,
      email: formValue.correoElectronico,
      contrasena: formValue.password,
      tipo_usuario: 'donante',
      nombre_completo: formValue.nombreCompleto,
      direccion: formValue.direccion || "Sin dirección",
      comuna: formValue.comuna || "Santiago",
      fono: formValue.telefono,
      fecha_nacimiento: formValue.fechaNacimiento,
      nacionalidad: "Chilena",
      tipo_sangre: formValue.tipoSangre,
      dispo_dia_donacion: "Lunes",
      nuevo_donante: formValue.nuevoDonante,
      noti_emergencia: formValue.recibirNotificaciones,
      sexo: formValue.sexo,
      ocupacion: formValue.ocupacion || "Sin especificar",
    };

    try {
      this.apiService.registrarUsuario(nuevoDonante).subscribe({
        next: async (res) => {
          console.log('Registro exitoso:', res);
          await this.showToast('Registro completado correctamente', 'success');
          this.router.navigate(['/login']);
        },
        error: async (err) => {
          console.error('Error en el registro:', err);
          await this.showToast(`Error al registrar: ${err.message}`, 'danger');
        }
      });
    } catch (err) {
      await this.showToast('Error inesperado en el registro', 'danger');
      console.error('Error inesperado:', err);
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  ngOnInit() {
    // Configurar el comportamiento del teclado
    this.keyboardService.setKeyboardConfig();
  }

  ngOnDestroy() {
    // El servicio maneja automáticamente la limpieza de listeners
  }
}
