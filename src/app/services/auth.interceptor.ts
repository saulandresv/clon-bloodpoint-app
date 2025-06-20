import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('authToken');
    console.log('[INTERCEPTOR] Token:', token);

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Token ${token}`)
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
  
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userRole: string = '';

  constructor() {
    // Obtener el rol del usuario del localStorage o de donde lo almacenes
    this.userRole = localStorage.getItem('userRole') || '';
  }

  getUserRole(): string {
    return this.userRole;
  }

  setUserRole(role: string) {
    this.userRole = role;
    localStorage.setItem('userRole', role);
  }
}
