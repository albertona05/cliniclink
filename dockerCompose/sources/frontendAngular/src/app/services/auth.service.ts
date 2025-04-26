import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://backend:3000'; // Cambiar la URL del backend para que coincida con el servidorNode
  
  constructor(private http: HttpClient) {}

  login(email: string, contrasena: string): Observable<any> {
    console.log('AuthService: Intentando login para usuario', email);
    return this.http.post(`${this.apiUrl}/login`, { email, contrasena })
      .pipe(
        tap((response: any) => {
          if (response.token) {
            console.log('AuthService: Login exitoso, token recibido');
            localStorage.setItem('token', response.token);
          } else {
            console.log('AuthService: Login fallido, no se recibió token');
          }
        })
      );
  }

  logout(): void {
    console.log('AuthService: Realizando logout');
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  handleResponse(response: any): string {
    if (response.message) {
      return response.message;
    }
    return 'Operación exitosa';
  }

  handleError(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }
    return 'Error desconocido';
  }
}