import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  
  constructor(private http: HttpClient, private router: Router) {}

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
          
          // Si el token está próximo a expirar (menos de 1 hora), solo retornar null
          if (expirationTime - currentTime < 3600000) {
            console.log('AuthService: Token próximo a expirar');
            return null;
          }
        }
        return token;
      } catch (error) {
        console.error('AuthService: Error al verificar token:', error);
        return null;
      }
    }
    return null;
  }

  getUserName(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.nombre || null;
        }
      } catch (error) {
        console.error('AuthService: Error al obtener nombre de usuario:', error);
      }
    }
    return null;
  }

  getUserDni(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.dni || null;
        }
      } catch (error) {
        console.error('AuthService: Error al obtener DNI de usuario:', error);
      }
    }
    return null;
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.rol || null;
        }
      } catch (error) {
        console.error('AuthService: Error al obtener rol de usuario:', error);
      }
    }
    return null;
  }

  getUserID(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return payload.id || null;
        }
      } catch (error) {
        console.error('AuthService: Error al obtener ID de usuario:', error);
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

  logout(): Observable<any> {
    console.log('AuthService: Iniciando proceso de logout');
    const token = this.getToken();
    
    // Limpiar el token del localStorage
    localStorage.removeItem('token');
    
    // Realizar la navegación inmediatamente para asegurar que ocurra
    // independientemente de si alguien se suscribe al Observable
    setTimeout(() => {
      console.log('AuthService: Redirigiendo a login');
      this.router.navigate(['/login']);
    }, 0);
    
    // Si hay un token, notificar al backend
    if (token) {
      return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
        tap(() => {
          console.log('AuthService: Logout exitoso en el backend');
        }),
        catchError(error => {
          console.error('AuthService: Error durante el logout:', error);
          return throwError(() => error);
        }),
        finalize(() => {
          console.log('AuthService: Finalizando proceso de logout');
        })
      );
    }
    
    // Si no hay token, simplemente completar el Observable
    return new Observable(subscriber => {
      console.log('AuthService: No hay token para logout');
      subscriber.complete();
    });
  }
}