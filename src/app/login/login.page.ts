import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { KeyboardService } from '../services/keyboard.service';
import { LoginCredentials, LoginResponse } from '../interfaces/login';
import { ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, RouterModule, CommonModule],
})
export class LoginPage implements OnInit, OnDestroy {
  tipoUsuario: 'donante' | 'representante' = 'donante';
  
  credentials: LoginCredentials & { email?: string } = {
    rut: '',
    password: '',
    email: ''
  };

  abrirRecuperarContrasena() {
  window.open('https://bloodpoint-core-qa.herokuapp.com/password-reset/', '_blank');
  }

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
    if (this.tipoUsuario !== 'donante') {
      this.credentials.rut = valor;
      return;
    }
  
    const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  
    if (limpio.length < 2) {
      this.credentials.rut = limpio;
      return;
    }
  
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
  
    let cuerpoFormateado = cuerpo;
    if (cuerpo.length >= 4) {
      cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  
    this.credentials.rut = `${cuerpoFormateado}-${dv}`;
  }

  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private keyboardService: KeyboardService
  ) {}

  ngOnInit() {
    // Configurar el comportamiento del teclado
    this.keyboardService.setKeyboardConfig();
  }

  ngOnDestroy() {
    // El servicio maneja automáticamente la limpieza de listeners
  }

  async onLogin() {
    const isDonante = this.tipoUsuario === 'donante';
  
    if (isDonante && (!this.credentials.rut || !this.validarRut(this.credentials.rut))) {
      await this.showToast('Ingrese un RUT válido', 'warning');
      return;
    }
  
    if (!isDonante && (!this.credentials.email || !this.credentials.email.includes('@'))) {
      await this.showToast('Ingrese un correo válido', 'warning');
      return;
    }
  
    if (!this.credentials.password || this.credentials.password.length < 8) {
      await this.showToast('La contraseña debe tener al menos 8 caracteres', 'warning');
      return;
    }
  
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'circles'
    });
    await loading.present();
  
    try {
      this.apiService.login(this.credentials).subscribe({
        next: async (response: LoginResponse) => {
          await loading.dismiss();
          if (response.status === 'success') {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userId', response.user_id.toString());
            localStorage.setItem('tipoUsuario', response.tipo_usuario);

            await this.showToast('Inicio de sesión exitoso', 'success');
            
            setTimeout(async () => {
              await this.router.navigate(['/menu/index']);
            }, 100);
          } else {
            await this.showToast('Credenciales inválidas', 'danger');
          }
        },
        error: async (error) => {
          await loading.dismiss();
          await this.showToast('Error al iniciar sesión', 'danger');
          console.error('Error de login:', error);
        }
      });
    } catch (error) {
      await loading.dismiss();
      await this.showToast('Error inesperado', 'danger');
      console.error('Error inesperado:', error);
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

  goBack() {
    this.router.navigate(['/menu/index']);
  }

  requestLocationPermission() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Ubicación permitida");
        localStorage.setItem('userLocation', JSON.stringify({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }));
      },
      (error) => {
        console.warn("Ubicación denegada:", error);
        localStorage.removeItem('userLocation');
      }
    );
  } else {
    console.warn("Geolocalización no disponible.");
  }
}
}
