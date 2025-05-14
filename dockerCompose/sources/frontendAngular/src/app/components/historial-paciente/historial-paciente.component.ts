import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { HistorialService } from '../../services/historial.service';

@Component({
  selector: 'app-historial-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './historial-paciente.component.html',
  styleUrls: ['./historial-paciente.component.css']
})
export class HistorialPacienteComponent implements OnInit {
  historialCitas: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  idPaciente: string = '';
  
  constructor(
    private historialService: HistorialService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.idPaciente = this.route.snapshot.paramMap.get('id') || '';
    if (this.idPaciente) {
      this.cargarHistorial();
    } else {
      this.mensajeError = 'ID de paciente no proporcionado';
    }
  }
  
  cargarHistorial(): void {
    this.cargando = true;
    this.mensajeError = '';
    
    this.historialService.obtenerHistorialPaciente(this.idPaciente)
      .pipe(
        catchError(error => {
          console.error('Error al cargar historial:', error);
          this.mensajeError = 'Error al cargar el historial del paciente';
          return of({ success: false, data: [] });
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(response => {
        if (response && response.success && response.data) {
          this.historialCitas = response.data;
          
          // Ordenar citas de la más reciente a la más antigua
          this.historialCitas.sort((a, b) => {
            const fechaA = new Date(a.fecha + 'T' + a.hora);
            const fechaB = new Date(b.fecha + 'T' + b.hora);
            return fechaB.getTime() - fechaA.getTime();
          });
        } else {
          this.historialCitas = [];
          if (!this.mensajeError) {
            this.mensajeError = 'No se pudo cargar el historial';
          }
        }
      });
  }
  
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    
    try {
      // Extraer solo la parte de la fecha (año, mes, día) antes de la 'T'
      const fechaSolo = fecha.split('T')[0];
      const fechaObj = new Date(fechaSolo);
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        console.error('Fecha inválida:', fecha);
        return 'Fecha no disponible';
      }
      
      const opciones: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return fechaObj.toLocaleDateString('es-ES', opciones);
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha no disponible';
    }
  }
  
  volver(): void {
    this.router.navigate(['/detalle-paciente', this.idPaciente]);
  }
}