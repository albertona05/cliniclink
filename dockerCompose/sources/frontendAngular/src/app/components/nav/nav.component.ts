import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {
  userName: string | null = null;
  userRole: string | null = null;
  private apiUrl = 'http://localhost:3000';

  constructor(private authService: AuthService, private router: Router, private http: HttpClient) {
    this.updateUserInfo();
  }

  navigateToCitas() {
    const userId = this.authService.getUserID();
    if (userId) {
      this.router.navigate(['/citas-paciente', userId]);
    }
  }

  navigateToFacturas() {
    const userId = this.authService.getUserID();
    if (userId) {
      // Primero obtenemos el id_paciente a partir del id_usuario
      this.http.get<any>(`${this.apiUrl}/pacientes/usuario/${userId}`).subscribe({
        next: (response) => {
          if (response && response.success && response.id) {
            // Navegamos a facturas con el id_paciente
            this.router.navigate(['/facturas', response.id]);
          } else {
            console.error('No se pudo obtener el ID del paciente');
          }
        },
        error: (error) => {
          console.error('Error al obtener el ID del paciente:', error);
        }
      });
    }
  }

  navigateToHistorial() {
    const userId = this.authService.getUserID();
    if (userId) {
      this.router.navigate(['/historial-paciente', userId]);
    }
  }

  private updateUserInfo() {
    this.userName = this.authService.getUserName();
    this.userRole = this.authService.getUserRole();
  }

  // Métodos para verificar el rol del usuario
  isMedico(): boolean {
    return this.userRole === 'medico';
  }

  isRecepcionista(): boolean {
    return this.userRole === 'recepcion';
  }

  isPaciente(): boolean {
    return this.userRole === 'paciente';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => console.log('Logout exitoso'),
      error: (error) => console.error('Error en logout:', error)
    });
    return false;
  }
}