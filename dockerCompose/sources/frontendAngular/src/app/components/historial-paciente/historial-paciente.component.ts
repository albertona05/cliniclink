import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { HistorialService } from '../../services/historial.service';
import { BotonVolverComponent } from '../boton-volver/boton-volver.component';

@Component({
  selector: 'app-historial-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent, BotonVolverComponent],
  templateUrl: './historial-paciente.component.html',
  styleUrls: ['./historial-paciente.component.css']
})
export class HistorialPacienteComponent implements OnInit {
  historialCitas: any[] = [];
  historialFiltrado: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  idPaciente: string = '';
  
  // Variables para filtrado
  filtroTexto: string = '';
  filtroTipo: string = 'todos';
  
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
          
          // Inicializar el historial filtrado con todos los registros
          this.historialFiltrado = [...this.historialCitas];
          
          // Mostrar mensaje de éxito
          if (this.historialCitas.length > 0) {
            this.mensajeError = '';
            this.mensajeExito = `Se han cargado ${this.historialCitas.length} registros médicos`;
          } else {
            this.mensajeError = '';
            this.mensajeExito = 'No hay registros en el historial médico';
          }
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
  
  /**
   * Filtra el historial por tipo (consulta, prueba o todos)
   */
  filtrarPorTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.aplicarFiltros();
  }
  
  /**
   * Aplica los filtros de texto y tipo al historial
   */
  aplicarFiltros(): void {
    // Primero filtramos por tipo
    let resultados = this.historialCitas;
    
    if (this.filtroTipo !== 'todos') {
      resultados = resultados.filter(cita => cita.tipo === this.filtroTipo);
    }
    
    // Luego aplicamos el filtro de texto si existe
    if (this.filtroTexto && this.filtroTexto.trim() !== '') {
      const textoFiltro = this.filtroTexto.toLowerCase().trim();
      resultados = resultados.filter(cita => 
        // Buscar en varios campos
        cita.medico?.toLowerCase().includes(textoFiltro) ||
        cita.especialidad?.toLowerCase().includes(textoFiltro) ||
        cita.info?.toLowerCase().includes(textoFiltro) ||
        (cita.tipo_prueba && cita.tipo_prueba.toLowerCase().includes(textoFiltro))
      );
    }
    
    this.historialFiltrado = resultados;
  }
  
  /**
   * Limpia todos los filtros aplicados
   */
  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroTipo = 'todos';
    this.historialFiltrado = [...this.historialCitas];
  }
}