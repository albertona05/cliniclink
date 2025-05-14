import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { CitaService } from '../../services/cita.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reservar-cita',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './reservar-cita.component.html',
  styleUrls: ['./reservar-cita.component.css']
})
export class ReservarCitaComponent implements OnInit {
  fecha: string = '';
  medico: string = '';
  pacienteDni: string = '';
  horasDisponibles: string[] = [];
  horaSeleccionada: string = '';
  medicos: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  fechaMinima: string = '';
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private citaService: CitaService,
    private authService: AuthService
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
    
    // Obtener el DNI del paciente del token JWT
    this.obtenerDniPaciente();
  }
  
  obtenerDniPaciente() {
    // Obtener el token y extraer el DNI del payload
    const token = this.authService.getToken();
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          this.pacienteDni = payload.dni || '';
          
          if (!this.pacienteDni) {
            this.mensajeError = 'No se pudo obtener el DNI del paciente';
          }
        }
      } catch (error) {
        console.error('Error al obtener DNI del paciente:', error);
        this.mensajeError = 'Error al obtener información del paciente';
      }
    } else {
      this.mensajeError = 'Usuario no autenticado';
      this.router.navigate(['/login']);
    }
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
    if (!this.fecha) {
      this.mensajeError = 'Debe seleccionar una fecha';
      return;
    }
    
    if (!this.medico || this.medico === '') {
      this.mensajeError = 'Debe seleccionar un médico';
      return;
    }
    
    if (!this.horaSeleccionada) {
      this.mensajeError = 'Debe seleccionar una hora disponible';
      return;
    }
    
    if (!this.pacienteDni || this.pacienteDni.trim() === '') {
      this.mensajeError = 'No se pudo obtener el DNI del paciente';
      return;
    }
    
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    
    const citaData = {
      fecha: this.fecha,
      hora: this.horaSeleccionada,
      medicoId: this.medico,
      pacienteId: this.pacienteDni.trim() // El servicio transformará esto a dni_paciente
    };
    
    try {
      this.citaService.crearCita(citaData)
        .pipe(
          catchError(error => {
            console.error('Error al reservar cita:', error);
            this.mensajeError = error.error?.mensaje || 'Error al reservar la cita';
            return of(null);
          }),
          finalize(() => {
            this.cargando = false;
          })
        )
        .subscribe(response => {
          if (response) {
            this.mensajeExito = 'Cita reservada correctamente';
            // Limpiar los campos después de reservar
            this.horaSeleccionada = '';
            this.horasDisponibles = [];
          }
        });
    } catch (error) {
      console.error('Excepción capturada al intentar crear cita:', error);
      this.mensajeError = 'Error en la aplicación al procesar la solicitud';
      this.cargando = false;
    }
  }
  
  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }
  
  volver() {
    this.router.navigate(['/']);
  }
}