import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clinicLink';
  showPassword = false;
  email: string = '';
  contrasena: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
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
        const successMessage = this.authService.handleResponse(response);
        console.log(successMessage);
      },
      error: (error) => {
        this.errorMessage = this.authService.handleError(error);
      }
    });
  }

  ngOnInit() {
    this.checkConnection();
  }

  checkConnection() {
    this.http.get('http://192.168.2.2:3000/login').subscribe({
      next: () => console.log('Conexión exitosa con el servidor.'),
      error: (error) => {
        console.error('Error al conectar con el servidor:', error);
        this.errorMessage = 'Error al conectar con el servidor: ' + (error.message || 'Unknown Error');
        console.error('Detalles del error:', error);
      }
    });
  }
}
