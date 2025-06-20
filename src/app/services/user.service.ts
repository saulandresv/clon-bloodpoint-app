import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://bloodpoint-core-qa-35c4ecec4a30.herokuapp.com/representantes';

  constructor(private http: HttpClient) {}

  isRepresentante(userId: number): Observable<boolean> {
    return this.http.get<{ is_representante: boolean }>(`${this.apiUrl}/${userId}`).pipe(
      map(response => response.is_representante)
    );
  }  

  // Método para obtener el userId desde el almacenamiento local o donde lo tengas
  getUserId(): Observable<number> {
    const userId = localStorage.getItem('userId');
    console.log('userId del localStorage:', userId);
    const userIdNum = parseInt(userId || '0', 10);
    console.log('userId convertido a número:', userIdNum);
    return new Observable(observer => {
      observer.next(userIdNum);
      observer.complete();
    });
  }
}
