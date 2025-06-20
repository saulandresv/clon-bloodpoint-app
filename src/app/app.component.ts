import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OnInit } from '@angular/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.checkSession();
    this.initPushNotifications();
  }

  async initPushNotifications() {
    try {
      const permStatus = await FirebaseMessaging.requestPermissions();
      if (permStatus.receive === 'granted') {
        const token = await FirebaseMessaging.getToken();
        console.log('📲 FCM Token:', token.token);
  
        FirebaseMessaging.addListener('notificationReceived', event => {
          console.log('📩 Notificación en primer plano:', event);
        });
  
        FirebaseMessaging.addListener('notificationActionPerformed', event => {
          console.log('🟢 Notificación abierta:', event);
        });
      } else {
        console.warn('❌ Permiso de notificaciones no concedido');
      }
    } catch (err) {
      console.error('🚫 Error en initPushNotifications', err);
    }
  }

  checkSession() {
    const token = localStorage.getItem('authToken');

    const isOnLogin = this.router.url.includes('/login');
    const isOnHome = this.router.url.includes('/menu');

    if (token && !isOnHome) {
      this.router.navigate(['/menu/index']);
    } else if (!token && !isOnLogin) {
      this.router.navigate(['/login']);
    }
  }
}
