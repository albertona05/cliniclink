import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { CitaService } from '../../services/cita.service';

@Component({
  selector: 'app-gestionar-cita',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './gestionar-cita.component.html',
  styleUrls: ['./gestionar-cita.component.css']
})
export class GestionarCitaComponent implements OnInit {
  fecha: string = '';
  medico: string = '';
  pacienteId: string = '';
  horasDisponibles: string[] = [];
  horaSeleccionada: string = '';
  medicos: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  fechaMinima: string = '';
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private citaService: CitaService
  ) {}

  ngOnInit() {
    // Establecer la fecha mínima como mañana
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    this.fechaMinima = manana.toISOString().split('T')[0];
    this.fecha = this.fechaMinima;
    
    // Cargar la lista de médicos disponibles
    this.cargarMedicos();
    
    // Verificar si se pasó un ID de paciente como parámetro
    this.route.queryParams.subscribe(params => {
      if (params['pacienteId']) {
        this.pacienteId = params['pacienteId'];
      }
    });
  }
  
  cargarMedicos() {
    this.cargando = true;
    this.mensajeError = '';
    
    this.http.get<any>('http://localhost:3000/medicos')
      .pipe(
        catchError(error => {
          console.error('Error al cargar médicos:', error);
          this.mensajeError = 'Error al cargar la lista de médicos';
          return of({ success: false, data: [] });
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(response => {
        if (response && response.success && response.data) {
          this.medicos = response.data;
        } else {
          this.medicos = [];
          if (!this.mensajeError) {
            this.mensajeError = 'No se pudieron cargar los médicos';
          }
        }
      });
  }
  
  consultarHorasDisponibles() {
    if (!this.fecha || !this.medico) {
      this.mensajeError = 'Debe seleccionar fecha y médico';
      return;
    }
    
    this.cargando = true;
    this.mensajeError = '';
    this.horasDisponibles = [];
    
    this.http.get<any>(`http://localhost:3000/medicos/horas-libres?fecha=${this.fecha}&id_medico=${this.medico}`)
      .pipe(
        catchError(error => {
          console.error('Error al consultar disponibilidad:', error);
          this.mensajeError = 'Error al consultar horas disponibles';
          return of({ success: false, data: { horas_disponibles: [] } });
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(response => {
        if (response && response.success && response.data && response.data.horas_disponibles) {
          this.horasDisponibles = response.data.horas_disponibles;
        } else {
          this.horasDisponibles = [];
          if (!this.mensajeError) {
            this.mensajeError = 'No hay horas disponibles para la fecha seleccionada';
          }
        }
      });
  }
  
  reservarCita() {
    console.log('=== INICIO: Proceso de reserva de cita ===');
    console.log('Estado inicial de campos:', {
      fecha: this.fecha,
      medico: this.medico,
      horaSeleccionada: this.horaSeleccionada,
      pacienteId: this.pacienteId
    });
    
    // Validación más estricta de los campos
    if (!this.fecha) {
      console.log('Error de validación: Fecha vacía');
      this.mensajeError = 'Debe seleccionar una fecha';
      return;
    }
    
    if (!this.medico || this.medico === '') {
      console.log('Error de validación: Médico no seleccionado');
      this.mensajeError = 'Debe seleccionar un médico';
      return;
    }
    console.log('Tipo de dato de médico:', typeof this.medico, 'Valor:', this.medico);
    
    if (!this.horaSeleccionada) {
      console.log('Error de validación: Hora no seleccionada');
      this.mensajeError = 'Debe seleccionar una hora disponible';
      return;
    }
    
    if (!this.pacienteId || this.pacienteId.trim() === '') {
      console.log('Error de validación: DNI de paciente vacío');
      this.mensajeError = 'Debe ingresar el DNI del paciente';
      return;
    }
    console.log('Tipo de dato de pacienteId:', typeof this.pacienteId, 'Valor:', this.pacienteId);
    
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    
    const citaData = {
      fecha: this.fecha,
      hora: this.horaSeleccionada,
      medicoId: this.medico,
      pacienteId: this.pacienteId.trim() // El servicio transformará esto a dni_paciente
    };
    
    // Verificación detallada antes de enviar
    console.log('Datos a enviar al servicio:', JSON.stringify(citaData));
    console.log('Tipos de datos:', {
      fecha: typeof citaData.fecha,
      hora: typeof citaData.hora,
      medicoId: typeof citaData.medicoId,
      pacienteId: typeof citaData.pacienteId
    });
    
    try {
      this.citaService.crearCita(citaData)
        .pipe(
          catchError(error => {
            console.error('Error al reservar cita:', error);
            console.error('Detalles del error:', {
              status: error.status,
              statusText: error.statusText,
              mensaje: error.error?.mensaje,
              error: error.error
            });
            this.mensajeError = error.error?.mensaje || 'Error al reservar la cita';
            return of(null);
          }),
          finalize(() => {
            console.log('Finalización de la solicitud de cita');
            this.cargando = false;
          })
        )
        .subscribe(response => {
          console.log('Respuesta del servidor:', response);
          if (response) {
            console.log('Cita creada exitosamente:', response);
            this.mensajeExito = 'Cita reservada correctamente';
            // Limpiar los campos después de reservar
            this.horaSeleccionada = '';
            this.horasDisponibles = [];
          } else {
            console.log('No se recibió respuesta válida del servidor');
          }
        });
    } catch (error) {
      console.error('Excepción capturada al intentar crear cita:', error);
      this.mensajeError = 'Error en la aplicación al procesar la solicitud';
      this.cargando = false;
    }
    console.log('=== FIN: Proceso de reserva de cita ===');
  }
  
  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }
  
  volver() {
    this.router.navigate(['/buscar-paciente']);
  }
}