import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  showPassword = false;
  email: string = '';
  contrasena: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.errorMessage = '';
    this.authService.login(this.email, this.contrasena).subscribe({
      next: (response) => {
        console.log('Login exitoso');
        const rol = this.authService.getUserRole();
        if (rol === 'recepcion') {
          this.router.navigate(['/buscar-paciente']);
        } else if (rol === 'paciente') {
          this.router.navigate(['/reservar-cita']);
        } else {
          this.errorMessage = 'Rol de usuario no válido';
          return;
        }
        const successMessage = this.authService.handleResponse(response);
        console.log(successMessage);
      },
      error: (error) => {
        this.errorMessage = this.authService.handleError(error);
      }
    });
  }
}