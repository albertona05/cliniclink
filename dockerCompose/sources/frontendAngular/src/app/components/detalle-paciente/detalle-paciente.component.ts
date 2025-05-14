import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { PacienteService } from '../../services/paciente.service';

@Component({
  selector: 'app-detalle-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './detalle-paciente.component.html',
  styleUrls: ['./detalle-paciente.component.css']
})
export class DetallePacienteComponent implements OnInit {
  paciente: any = {
    id: '',
    nombre: '',
    email: '',
    dni: '',
    telefono: '',
    fechaNacimiento: '',
    direccion: '',
    grupoSanguineo: '',
    alergias: '',
    enfermedadesCronicas: '',
    medicacionActual: '',
    ultimaVisita: '',
    proximaCita: '',
    totalVisitas: 0
  };
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private pacienteService: PacienteService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.cargarPaciente(params['id']);
      }
    });
  }
  
  cargarPaciente(id: string) {
    this.cargando = true;
    this.mensajeError = '';
    
    // En Angular 19, es mejor usar el interceptor para manejar los tokens
    // y usar el patrón pipe para manejar los observables
    this.pacienteService.obtenerPaciente(id)
      .pipe(
        catchError(error => {
          console.error('Error al cargar paciente:', error);
          this.mensajeError = 'Error al cargar los datos del paciente';
          return of(null);
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(response => {
        if (response) {
          // Datos básicos del paciente
          this.paciente = {
            id: response.id,
            nombre: response.nombre,
            email: response.email,
            dni: response.dni,
            telefono: response.telefono,
            fechaNacimiento: response.fechaNacimiento,
            direccion: response.direccion,
            
            // Datos médicos (pueden ser null si no existen en la respuesta)
            grupoSanguineo: response.grupoSanguineo || '',
            alergias: response.alergias || '',
            enfermedadesCronicas: response.enfermedadesCronicas || '',
            medicacionActual: response.medicacionActual || '',
            
            // Datos de actividad
            ultimaVisita: response.ultimaVisita || '',
            proximaCita: response.proximaCita || '',
            totalVisitas: response.totalVisitas || 0
          };
          
          console.log(this.paciente);
        } else if (!this.mensajeError) {
          this.mensajeError = 'Error al cargar los datos del paciente';
        }
      });
  }

  verCitas() {
    this.router.navigate(['/citas-paciente', this.paciente.id]);
  }

  verFacturas() {
    this.router.navigate(['/facturas', this.paciente.id]);
  }

  verHistorial() {
    this.router.navigate(['/historial-paciente', this.paciente.id], { queryParams: { id: this.paciente.id } });
  }

  guardarCambios() {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.pacienteService.actualizarPaciente(this.paciente.id, this.paciente)
      .pipe(
        catchError(error => {
          console.error('Error al guardar cambios:', error);
          this.mensajeError = 'Error al guardar los cambios';
          return of({ success: false });
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(response => {
        if (response && response.success !== false) {
          this.mensajeExito = 'Paciente actualizado correctamente';
        } else if (!this.mensajeError) {
          this.mensajeError = 'Error al guardar los cambios';
        }
      });
  }
  
  volver() {
    this.router.navigate(['/buscar-paciente']);
  }
  }
