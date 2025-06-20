import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';
import { FirebaseService, NotificationPayload } from '../services/firebase.service';
import { LoadingController, ToastController } from '@ionic/angular';

interface AchievementNotification {
  id: number;
  achievement: {
    name: string;
    description: string;
    category: string;
    symbol: string;
  };
  achieved_at: string;
  notified: boolean;
}

@Component({
  selector: 'app-notificacion',
  templateUrl: 'notificacion.page.html',
  styleUrls: ['notificacion.page.scss'],
  standalone: false,
})
export class NotificacionPage implements OnInit, OnDestroy {
  achievementNotifications: AchievementNotification[] = [];
  loading = false;
  private notificationSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private firebaseService: FirebaseService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUnnotifiedAchievements();
    this.subscribeToNotifications();
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  private subscribeToNotifications() {
    this.notificationSubscription = this.firebaseService.notification$.subscribe(
      (notification: NotificationPayload | null) => {
        if (notification && notification.data?.type === 'achievement') {
          this.handleNewAchievementNotification(notification);
        }
      }
    );
  }

  private handleNewAchievementNotification(notification: NotificationPayload) {
    // Refresh the achievement list when a new achievement notification arrives
    this.loadUnnotifiedAchievements();
    
    // Show a toast notification
    this.showToast(`¡Nuevo logro: ${notification.data.achievement_name}!`, 'success');
  }

  async loadUnnotifiedAchievements() {
    this.loading = true;
    
    try {
      const response = await this.apiService.getUnnotifiedAchievements().toPromise();
      this.achievementNotifications = response || [];
    } catch (error) {
      console.error('Error loading unnotified achievements:', error);
      this.showToast('Error al cargar notificaciones', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async markAsRead(notification: AchievementNotification) {
    try {
      await this.apiService.markAchievementsAsNotified([notification.id]).toPromise();
      
      // Remove from local array
      this.achievementNotifications = this.achievementNotifications.filter(
        n => n.id !== notification.id
      );
      
      this.showToast('Notificación marcada como leída', 'success');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      this.showToast('Error al marcar notificación', 'danger');
    }
  }

  async markAllAsRead() {
    if (this.achievementNotifications.length === 0) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Marcando notificaciones...'
    });
    await loading.present();

    try {
      const achievementIds = this.achievementNotifications.map(n => n.id);
      await this.apiService.markAchievementsAsNotified(achievementIds).toPromise();
      
      this.achievementNotifications = [];
      this.showToast('Todas las notificaciones marcadas como leídas', 'success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      this.showToast('Error al marcar notificaciones', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async testNotification() {
    try {
      const loading = await this.loadingController.create({
        message: 'Enviando notificación de prueba...'
      });
      await loading.present();

      await this.apiService.sendTestNotification({
        title: 'Notificación de Prueba',
        body: 'Esta es una notificación de prueba desde BloodPoint'
      }).toPromise();

      loading.dismiss();
      this.showToast('Notificación de prueba enviada', 'success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      this.showToast('Error al enviar notificación de prueba', 'danger');
    }
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'basic': 'trophy',
      'level': 'star',
      'social': 'people',
      'rare': 'diamond'
    };
    return iconMap[category] || 'trophy';
  }

  getCategoryColor(category: string): string {
    const colorMap: { [key: string]: string } = {
      'basic': 'primary',
      'level': 'warning',
      'social': 'success',
      'rare': 'tertiary'
    };
    return colorMap[category] || 'primary';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }

  async doRefresh(event: any) {
    await this.loadUnnotifiedAchievements();
    event.target.complete();
  }
}
