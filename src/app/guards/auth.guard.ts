import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private userService: UserService) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken');
    if (token) {
      return true; // Deja pasar
    } else {
      this.router.navigate(['/login']); // Bloquea y redirige al login
      return false;
    }
  }
}
