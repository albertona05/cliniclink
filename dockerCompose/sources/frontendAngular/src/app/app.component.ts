import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clinic-management';
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
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Error al iniciar sesión';
      }
    });
  }
}
