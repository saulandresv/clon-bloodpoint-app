import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken');

    if (token) {
      // Si ya está autenticado, redirigir a la home (o a la que tú quieras)
      this.router.navigate(['/menu/index']);
      return false;
    }

    // Si NO está autenticado, permitir acceso
    return true;
  }
}
