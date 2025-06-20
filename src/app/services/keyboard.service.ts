import { Injectable } from '@angular/core';
import { Keyboard } from '@capacitor/keyboard';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  private keyboardHeight = 0;
  private isKeyboardOpen = false;

  constructor(private platform: Platform) {
    this.initializeKeyboardListeners();
  }

  private initializeKeyboardListeners() {
    // Solo ejecutar en dispositivos móviles
    if (this.platform.is('capacitor')) {
      
      // Cuando el teclado se va a mostrar
      Keyboard.addListener('keyboardWillShow', (info) => {
        this.keyboardHeight = info.keyboardHeight;
        this.isKeyboardOpen = true;
        this.adjustViewForKeyboard(true);
      });

      // Cuando el teclado se va a ocultar
      Keyboard.addListener('keyboardWillHide', () => {
        this.isKeyboardOpen = false;
        this.adjustViewForKeyboard(false);
      });
    }
  }

  private adjustViewForKeyboard(show: boolean) {
    const content = document.querySelector('ion-content');
    if (content) {
      if (show) {
        // Agregar clase cuando el teclado está abierto
        content.classList.add('keyboard-is-open');
        // Ajustar padding inferior para evitar solapamiento
        content.style.setProperty('--padding-bottom', `${this.keyboardHeight}px`);
      } else {
        // Remover clase cuando el teclado se cierra
        content.classList.remove('keyboard-is-open');
        content.style.removeProperty('--padding-bottom');
      }
    }
  }

  // Método público para obtener el estado del teclado
  public getKeyboardHeight(): number {
    return this.keyboardHeight;
  }

  public isOpen(): boolean {
    return this.isKeyboardOpen;
  }

  // Método para cerrar el teclado manualmente
  public async hideKeyboard(): Promise<void> {
    if (this.platform.is('capacitor')) {
      await Keyboard.hide();
    }
  }

  // Método para configurar el comportamiento del teclado
  public async setKeyboardConfig(): Promise<void> {
    if (this.platform.is('capacitor')) {
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
      await Keyboard.setScroll({ isDisabled: false });
    }
  }
} 