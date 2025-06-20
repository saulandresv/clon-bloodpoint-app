import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { Share } from '@capacitor/share';
import { ToastController } from '@ionic/angular';

interface Achievement {
  name: string;
  user_completed: boolean;
  symbol: string;
}

@Component({
  selector: 'app-Logros',
  templateUrl: './Logros.page.html',
  styleUrls: ['./Logros.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
})
export class LogrosPage implements OnInit {

  achievements: Achievement[] = [];

  async share() {
    // Contar logros completados
    const logrosCompletados = this.achievements.filter(logro => logro.user_completed).length;
    const totalLogros = this.achievements.length;
    
    // Crear mensaje personalizado con logros
    const mensaje = `🏆 ¡Mis logros en BloodPoint! 

✅ ${logrosCompletados}/${totalLogros} logros completados
🩸 Donando sangre y salvando vidas
💪 ¡Cada donación cuenta!

¡Únete a BloodPoint y ayuda a salvar vidas! 💪❤️

#DonarSangre #BloodPoint #SalvarVidas #Logros`;

    try {
      // Usar Capacitor Share para Android nativo
      await Share.share({
        title: 'Mis logros en BloodPoint',
        text: mensaje,
        url: 'https://bloodpoint.app',
        dialogTitle: 'Compartir mis logros'
      });

      console.log('✅ Logros compartidos exitosamente');
      
      // Mostrar toast de confirmación
      const toast = await this.toastController.create({
        message: '🎉 ¡Logros compartidos exitosamente!',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();

    } catch (error: any) {
      console.error('❌ Error al compartir logros:', error);
      
      // Si el usuario canceló, no mostrar error
      if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
        console.log('📋 Usuario canceló el compartir');
        return;
      }
      
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(mensaje);
        
        const toast = await this.toastController.create({
          message: '📋 Mensaje copiado al portapapeles',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      } catch (clipboardError) {
        console.error('❌ Error al copiar al portapapeles:', clipboardError);
        
        const toast = await this.toastController.create({
          message: 'Error al compartir. Inténtalo de nuevo.',
          duration: 2000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    }
  }

  constructor(
    private apiService: ApiService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.apiService.getAchievements().subscribe(
      data => this.achievements = data,
      err  => console.error('Error al cargar logros', err)
    );
  }

}
