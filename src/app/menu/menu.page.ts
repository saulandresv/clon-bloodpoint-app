import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-Menu',
  templateUrl: 'Menu.page.html',
  styleUrls: ['Menu.page.scss'],
  standalone: false,
})
export class MenuPage implements OnInit, OnDestroy {
  tipoUsuario: string | null = null;
  private routerSubscription!: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateTipoUsuario();
    
    // Actualizar tipoUsuario cada vez que cambie la ruta
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateTipoUsuario();
      });

    // También escuchar cambios en el storage
    window.addEventListener('storage', () => {
      this.updateTipoUsuario();
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    window.removeEventListener('storage', () => {
      this.updateTipoUsuario();
    });
  }

  private updateTipoUsuario() {
    const prevTipo = this.tipoUsuario;
    this.tipoUsuario = localStorage.getItem('tipoUsuario');
    
    if (prevTipo !== this.tipoUsuario) {
      console.log('Tipo usuario actualizado:', prevTipo, '->', this.tipoUsuario);
    }
  }

  // Método público para forzar actualización
  public forceUpdateTipoUsuario() {
    this.updateTipoUsuario();
  }
}
