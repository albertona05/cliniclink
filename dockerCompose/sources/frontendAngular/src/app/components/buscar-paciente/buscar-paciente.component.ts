import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';

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
  
  constructor(private http: HttpClient) {}
  
  buscarPaciente() {
    this.cargando = true;
    this.mensajeError = '';
    const token = localStorage.getItem('token')
    this.http.get<any[]>(`http://localhost:3000/pacientes/buscar?busqueda=${this.terminoBusqueda}`, { headers: { Authorization: `Bearer ${token}` } })
      .subscribe(
        data => {
          this.pacientes = data;
          this.cargando = false;
        },
        error => {
          this.mensajeError = 'Error al buscar pacientes';
          this.cargando = false;
        }
      );
  }

  verDetallesPaciente(pacienteId: string) {
    console.log(`Ver detalles del paciente: ${pacienteId}`);
  }
}