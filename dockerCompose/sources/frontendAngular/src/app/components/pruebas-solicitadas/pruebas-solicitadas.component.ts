import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { Prueba, PruebaResponse, PruebaService } from '../../services/prueba.service';
import { NavComponent } from '../nav/nav.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

declare var bootstrap: any;

@Component({
  selector: 'app-pruebas-solicitadas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './pruebas-solicitadas.component.html',
  styleUrls: ['./pruebas-solicitadas.component.css']
})
export class PruebasSolicitadasComponent implements OnInit {
  pruebas: Prueba[] = [];
  loading = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  
  // Variables para la programación de la prueba
  fechaMinima: string = '';
  fecha: string = '';
  horasDisponibles: string[] = [];
  horaSeleccionada: string = '';
  pruebaSeleccionada: Prueba | null = null;
  // Variables para mostrar resultados
  pruebaSeleccionadaResultado: Prueba | null = null;
  
  constructor(
    private pruebaService: PruebaService,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    // Establecer la fecha mínima como mañana
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    this.fechaMinima = manana.toISOString().split('T')[0];
    this.fecha = this.fechaMinima;
  }

  ngOnInit(): void {
    this.cargarPruebas();
  }
  
  cargarPruebas(): void {
    this.loading = true;
    this.mensajeError = '';
    
    this.pruebaService.obtenerPruebasSolicitadas().subscribe({
      next: (response: PruebaResponse) => {
        if (response && response.success && response.data) {
          this.pruebas = response.data;
        } else {
          this.pruebas = [];
          this.mensajeError = 'No se pudieron cargar las pruebas';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar pruebas:', error);
        this.mensajeError = 'Error al cargar la lista de pruebas';
        this.loading = false;
      }
    });
  }
  
  formatearFecha(fecha: string): string {
    if (!fecha) return 'No disponible';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES');
  }

  seleccionarPrueba(prueba: Prueba) {
    this.pruebaSeleccionada = prueba;
    this.fecha = this.fechaMinima;
    this.horaSeleccionada = '';
    this.horasDisponibles = [];
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  consultarHorasDisponibles() {
    if (!this.fecha || !this.pruebaSeleccionada) {
      this.mensajeError = 'Debe seleccionar una fecha';
      return;
    }
    
    this.loading = true;
    this.mensajeError = '';
    this.horasDisponibles = [];
    
    // Consultar horas disponibles del médico asignado
    const medicoId = this.pruebaSeleccionada.medico_asignado;
    this.http.get<any>(`http://localhost:3000/medicos/horas-libres?fecha=${this.fecha}&id_medico=${medicoId}`)
      .pipe(
        catchError(error => {
          console.error('Error al consultar disponibilidad:', error);
          this.mensajeError = 'Error al consultar horas disponibles';
          return of({ success: false, data: { horas_disponibles: [] } });
        }),
        finalize(() => {
          this.loading = false;
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

  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }

  programarPrueba() {
    if (!this.pruebaSeleccionada || !this.fecha || !this.horaSeleccionada) {
      this.mensajeError = 'Debe seleccionar fecha y hora para la prueba';
      return;
    }

    this.loading = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const datosPrueba = {
      id: this.pruebaSeleccionada.id,
      fecha: this.fecha,
      hora: this.horaSeleccionada
    };

    this.http.post<any>('http://localhost:3000/pruebas/programar', datosPrueba)
      .pipe(
        catchError(error => {
          console.error('Error al programar prueba:', error);
          this.mensajeError = error.error?.mensaje || 'Error al programar la prueba';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          this.mensajeExito = 'Prueba programada correctamente';
          this.pruebaSeleccionada = null;
          this.horaSeleccionada = '';
          this.horasDisponibles = [];
          this.cargarPruebas(); // Recargar la lista de pruebas
        }
      });
  }

  cancelarProgramacion() {
    this.pruebaSeleccionada = null;
    this.fecha = this.fechaMinima;
    this.horaSeleccionada = '';
    this.horasDisponibles = [];
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  mostrarResultado(prueba: Prueba) {
    // Inicializar con un array vacío para evitar errores de undefined
    this.pruebaSeleccionadaResultado = {
      ...prueba,
      archivos: []
    };
    this.loading = true;
    
    // Cargar los archivos de la prueba
    console.log('Solicitando archivos para ID de cita asociada a la prueba:', prueba.id_cita || prueba.id);
    // Usar id_cita si existe, de lo contrario usar id de la prueba
    const idArchivos = prueba.id_cita || prueba.id;
    this.pruebaService.obtenerArchivosPrueba(idArchivos).subscribe({
      next: (response) => {
        console.log('Respuesta de archivos recibida:', response);
        if (response && Array.isArray(response)) {
          // Mapear los archivos para incluir URLs completas
          const archivos = response.map((archivo: any) => ({
            nombre: archivo.name,
            tipo: this.determinarTipoArchivo(archivo.name),
            url: `${this.pruebaService['apiUrl']}/pruebas/${idArchivos}/files/${archivo.name}`
          }));
          
          console.log('Archivos procesados:', archivos);
          
          // Actualizar la prueba con los archivos
          this.pruebaSeleccionadaResultado = {
            ...prueba,
            archivos: archivos
          };
          console.log('Prueba actualizada con archivos:', this.pruebaSeleccionadaResultado);
        } else {
          console.log('Respuesta no es un array o está vacía');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar archivos:', error);
        this.loading = false;
      }
    });
    
    // Inicializar el offcanvas de Bootstrap
    const offcanvasElement = document.getElementById('resultadoOffcanvas');
    if (offcanvasElement) {
      const bsOffcanvas = new bootstrap.Offcanvas(offcanvasElement);
      bsOffcanvas.show();
    }
  }
  
  determinarTipoArchivo(nombreArchivo: string): string {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'image/jpeg';
    } else if (extension === 'pdf') {
      return 'application/pdf';
    }
    return 'application/octet-stream';
  }

  abrirImagen(url: string) {
    // Abrir la imagen en una nueva ventana
    window.open(url, '_blank');
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}