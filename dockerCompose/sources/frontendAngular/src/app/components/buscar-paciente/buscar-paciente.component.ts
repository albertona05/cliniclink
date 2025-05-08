import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { Router } from '@angular/router';
import { Bootstrap } from 'bootstrap';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-buscar-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './buscar-paciente.component.html',
  styleUrls: ['./buscar-paciente.component.css']
})
export class BuscarPacienteComponent {
  terminoBusqueda: string = '';
  pacientes: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  
  constructor(private http: HttpClient, private router: Router) {}
  
  buscarPaciente() {
    this.cargando = true;
    this.mensajeError = '';
    
    // En Angular 19, es mejor usar el interceptor para manejar los tokens
    // y usar el patrón pipe para manejar los observables
    this.http.get<any>(`http://localhost:3000/pacientes/buscar?busqueda=${this.terminoBusqueda}`)
      .pipe(
        catchError(error => {
          console.error('Error en la búsqueda:', error);
          this.mensajeError = 'Error al buscar pacientes';
          return of({ success: false, data: [] });
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(response => {
        console.log('Respuesta del servidor:', response);
        if (response && response.success && response.data) {
          this.pacientes = response.data;
        } else {
          this.pacientes = [];
          if (!this.mensajeError) {
            this.mensajeError = 'Formato de respuesta incorrecto';
          }
        }
      });
  }

  verDetallesPaciente(pacienteId: string) {
    this.router.navigate(['/detalle-paciente', pacienteId]);
  }
}