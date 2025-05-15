import { Component, OnInit } from '@angular/core';
import { MedicoService } from '../../services/medico.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../nav/nav.component';
import { CitaService } from '../../services/cita.service';
import { catchError, finalize, of } from 'rxjs';


@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css']
})
export class AgendaComponent implements OnInit {
  fecha: string = '';
  citas: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  idMedico: string | null = null;

  constructor(
    private medicoService: MedicoService,
    private authService: AuthService,
    private router: Router,
    private citaService: CitaService
  ) {
    // Inicializar la fecha con el día actual
    const hoy = new Date();
    this.fecha = hoy.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Obtener el ID del médico del servicio de autenticación
    this.idMedico = this.authService.getUserID();
    
    if (!this.idMedico) {
      this.mensajeError = 'No se pudo obtener la información del médico';
      return;
    }
    
    // Cargar las citas del día actual al iniciar
    this.consultarCitas();
  }

    // Consulta las citas del día para el médico actual
  consultarCitas(): void {
    if (!this.idMedico) {
      this.mensajeError = 'No se pudo obtener la información del médico';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.medicoService.obtenerCitasDia(this.idMedico, this.fecha)
      .subscribe({
        next: (citas) => {
          this.citas = citas;
          this.cargando = false;
          if (citas.length === 0) {
            this.mensajeExito = 'No hay citas programadas para esta fecha';
          }
        },
        error: (error) => {
          console.error('Error al obtener citas:', error);
          this.mensajeError = 'Error al obtener las citas del día';
          this.cargando = false;
        }
      });
  }

  iniciarCita(idCita: number): void {
    console.log('Iniciando cita:', idCita);
    // Buscar el nombre del paciente en la lista de citas
    const cita = this.citas.find(c => c.id === idCita);
    const nombrePaciente = cita ? cita.nombre_paciente : 'Paciente';
    
    // Redirigir al componente datos-cita con el ID de la cita y el nombre del paciente
    this.router.navigate(['/datos-cita', idCita], { queryParams: { nombre: nombrePaciente } });
  }

  anularCita(idCita: string): void {
    if (confirm('¿Está seguro que desea anular esta cita?')) {
      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';
      
      this.citaService.anularCita(idCita)
        .pipe(
          catchError(error => {
            console.error('Error al anular cita:', error);
            this.mensajeError = 'Error al anular la cita';
            return of(null);
          }),
          finalize(() => {
            this.cargando = false;
          })
        )
        .subscribe(response => {
          if (response) {
            this.citas = this.citas.filter(cita => cita.id !== idCita);
            this.mensajeExito = 'Cita anulada correctamente';;
          }
        });
    }
  }

  formatearHora(hora: string): string {
    return hora.substring(0, 5);
  }
}