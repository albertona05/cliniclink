import { Component, OnInit } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-boton-volver',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boton-volver.component.html',
  styleUrls: ['./boton-volver.component.css']
})
export class BotonVolverComponent implements OnInit {
  esPaciente: boolean = false;

  constructor(
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar el rol del usuario al inicializar el componente
    const userRole = this.authService.getUserRole();
    this.esPaciente = userRole === 'paciente';
  }

  volver(): void {
    this.location.back();
  }
}