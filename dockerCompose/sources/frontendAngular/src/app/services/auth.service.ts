import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; // Cambiar la URL del backend para que coincida con el servidorNode
  
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
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar el token para verificar su expiración
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expirationTime = payload.exp * 1000; // Convertir a milisegundos
          const currentTime = Date.now();
          
          // Si el token está próximo a expirar (menos de 1 hora), hacer logout
          if (expirationTime - currentTime < 3600000) {
            console.log('AuthService: Token próximo a expirar, realizando logout');
            this.logout();
            return null;
          }
        }
        return token;
      } catch (error) {
        console.error('AuthService: Error al verificar token:', error);
        this.logout();
        return null;
      }
    }
    return null;
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