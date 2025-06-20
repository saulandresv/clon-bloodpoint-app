import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Platform } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { BehaviorSubject } from 'rxjs';

export interface NotificationPayload {
  title?: string;
  body?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: any;
  private messaging: any;
  private isInitialized = false;
  private notificationSubject = new BehaviorSubject<NotificationPayload | null>(null);
  
  // Observable for components to subscribe to notifications
  public notification$ = this.notificationSubject.asObservable();

  constructor(
    private platform: Platform,
    private apiService: ApiService
  ) {
    this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      // Initialize Firebase app
      this.app = initializeApp(environment.firebase);
      
      if (this.platform.is('capacitor')) {
        // Running on mobile device
        await this.initializeCapacitorFirebase();
      } else {
        // Running on web
        await this.initializeWebFirebase();
      }
      
      this.isInitialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  private async initializeCapacitorFirebase() {
    try {
      // Check permissions
      const result = await FirebaseMessaging.checkPermissions();
      
      if (result.receive !== 'granted') {
        const permissionResult = await FirebaseMessaging.requestPermissions();
        if (permissionResult.receive !== 'granted') {
          console.warn('Push notification permissions not granted');
          return;
        }
      }

      // Get FCM token
      const { token } = await FirebaseMessaging.getToken();
      if (token) {
        await this.registerDeviceToken(token, 'android');
      }

      // Listen for foreground messages
      FirebaseMessaging.addListener('notificationReceived', (notification) => {
        console.log('Foreground notification received:', notification);
        this.handleNotificationReceived(notification);
      });

      // Listen for notification actions (when user taps notification)
      FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
        console.log('Notification action performed:', action);
        this.handleNotificationAction(action);
      });

    } catch (error) {
      console.error('Error initializing Capacitor Firebase:', error);
    }
  }

  private async initializeWebFirebase() {
    try {
      // Get messaging instance
      this.messaging = getMessaging(this.app);

      // Register service worker for background messages
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      }

      // Listen for foreground messages
      onMessage(this.messaging, (payload: MessagePayload) => {
        console.log('Foreground message received:', payload);
        this.handleNotificationReceived({
          title: payload.notification?.title,
          body: payload.notification?.body,
          data: payload.data
        });
      });

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // You'll need to add this to Firebase Console
      });
      
      if (token) {
        await this.registerDeviceToken(token, 'web');
      }

    } catch (error) {
      console.error('Error initializing Web Firebase:', error);
    }
  }

  private async registerDeviceToken(token: string, deviceType: 'android' | 'ios' | 'web') {
    try {
      const deviceId = await this.getDeviceId();
      
      const response = await this.apiService.registerDeviceToken({
        token,
        device_type: deviceType,
        device_id: deviceId
      }).toPromise();
      
      console.log('Device token registered:', response);
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    // Try to get a unique device identifier
    if (this.platform.is('capacitor')) {
      try {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getId();
        return info.identifier || this.generateDeviceId();
      } catch {
        return this.generateDeviceId();
      }
    } else {
      // For web, generate a persistent ID
      let deviceId = localStorage.getItem('bloodpoint_device_id');
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        localStorage.setItem('bloodpoint_device_id', deviceId);
      }
      return deviceId;
    }
  }

  private generateDeviceId(): string {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  private handleNotificationReceived(notification: any) {
    // Emit notification to subscribers
    this.notificationSubject.next({
      title: notification.title,
      body: notification.body,
      data: notification.data
    });

    // Handle specific notification types
    if (notification.data?.type === 'achievement') {
      this.handleAchievementNotification(notification);
    }
  }

  private handleNotificationAction(action: any) {
    // Handle when user taps on notification
    const notification = action.notification;
    
    if (notification.data?.type === 'achievement') {
      // Navigate to achievements page or specific achievement
      // You can inject Router service and navigate here
      console.log('Achievement notification tapped:', notification.data);
    }
  }

  private handleAchievementNotification(notification: any) {
    // Show local notification or update UI for achievement
    console.log('New achievement notification:', notification);
    
    // You might want to show a toast or modal here
    // this.toastController.create({
    //   message: `¡Nuevo logro desbloqueado: ${notification.data.achievement_name}!`,
    //   duration: 3000,
    //   color: 'success'
    // }).then(toast => toast.present());
  }

  // Public methods for components to use
  public async requestPermission(): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      return true; // Web permissions are handled during initialization
    }

    try {
      const result = await FirebaseMessaging.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  public async getNotificationPermissionStatus(): Promise<string> {
    if (!this.platform.is('capacitor')) {
      return 'granted'; // Assume granted for web
    }

    try {
      const result = await FirebaseMessaging.checkPermissions();
      return result.receive;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return 'denied';
    }
  }

  public async refreshToken(): Promise<void> {
    try {
      if (this.platform.is('capacitor')) {
        const { token } = await FirebaseMessaging.getToken();
        if (token) {
          await this.registerDeviceToken(token, 'android');
        }
      } else if (this.messaging) {
        const token = await getToken(this.messaging);
        if (token) {
          await this.registerDeviceToken(token, 'web');
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  public isFirebaseInitialized(): boolean {
    return this.isInitialized;
  }
}
