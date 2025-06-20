import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { KeyboardService } from '../services/keyboard.service';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editarperfil',
  templateUrl: './editarperfil.page.html',
  styleUrls: ['./editarperfil.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
})
export class EditarperfilPage implements OnInit, OnDestroy {
  avatarUrl = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  nuevaImagen: File | null = null;

  form: any = {
    rut: '',
    nombre_completo: '',
    sexo: '',
    direccion: '',
    comuna: '',
    fono: '',
    fecha_nacimiento: '',
    nacionalidad: '',
    tipo_sangre: '',
    noti_emergencia: false,
    email: '',
    ocupacion: ''
  };

  constructor(
    private apiService: ApiService, 
    private toastController: ToastController,
    private keyboardService: KeyboardService
  ) {}

  ngOnInit() {
    this.cargarPerfilUsuario();
    // Configurar el comportamiento del teclado
    this.keyboardService.setKeyboardConfig();
  }

  ngOnDestroy() {
    // El servicio maneja automáticamente la limpieza de listeners
  }

  private cargarPerfilUsuario() {
    this.apiService.getPerfilUsuario().subscribe({
      next: (res) => {
        console.log('Datos del perfil recibidos:', res);
        const data = res.data;
        this.form = { ...this.form, ...data };
      },
      error: (err) => {
        console.error('Error al obtener perfil:', err);
        this.showToast('Error al cargar los datos del perfil', 'danger');
      }
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nuevaImagen = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  actualizarPerfil() {
    const datosAEnviar = {
      direccion: this.form.direccion,
      comuna: this.form.comuna,
      fono: this.form.fono,
      noti_emergencia: this.form.noti_emergencia,
      email: this.form.email,
      ocupacion: this.form.ocupacion
    };

    this.apiService.actualizarPerfilUsuario(datosAEnviar).subscribe({
      next: async (res) => {
        await this.showToast('Perfil actualizado exitosamente', 'success');
      },
      error: async (err) => {
        console.error('Error al actualizar perfil:', err);
        await this.showToast('Error al actualizar el perfil', 'danger');
      }
    });
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
}
