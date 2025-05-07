import { HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// En Angular 19, los interceptores son funciones en lugar de clases
export function AuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<any> {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  console.log('Interceptor: Interceptando solicitud', req.url);
  const token = authService.getToken();

  if (token) {
    console.log('Interceptor: Token encontrado, agregando header Authorization');
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.log('Interceptor: Error 401 - Token inválido o expirado');
          authService.logout();
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  console.log('Interceptor: No hay token, pasando solicitud sin modificar');
  return next(req);
}