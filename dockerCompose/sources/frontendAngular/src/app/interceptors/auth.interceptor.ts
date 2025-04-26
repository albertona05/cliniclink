import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('Interceptor: Interceptando solicitud', req.url);
    const token = localStorage.getItem('token');

    if (token) {
      console.log('Interceptor: Token encontrado, agregando header Authorization');
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }

    console.log('Interceptor: No hay token, pasando solicitud sin modificar');
    return next.handle(req);
  }
}