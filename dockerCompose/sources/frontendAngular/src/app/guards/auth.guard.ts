import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // Obtener el rol del usuario
    const userRole = this.authService.getUserRole();
    
    // Si no hay rol, denegar acceso
    if (!userRole) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // Obtener los roles permitidos para esta ruta desde los metadatos de la ruta
    const rolesPermitidos = route.data['rolesPermitidos'] as string[] || [];
    
    // Verificar si el rol del usuario está permitido para esta ruta
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(userRole)) {
      // Si el usuario es de recepción, redirigir a buscar-paciente
      if (userRole === 'recepcion') {
        this.router.navigate(['/buscar-paciente']);
      } else {
        // Para otros roles no autorizados, redirigir al login
        this.router.navigate(['/login']);
      }
      return false;
    }
    
    // El usuario está autenticado y tiene un rol permitido para esta ruta
    return true;
  }
}