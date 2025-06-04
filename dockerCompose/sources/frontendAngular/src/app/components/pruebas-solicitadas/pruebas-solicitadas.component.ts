import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  pruebasFiltradas: Prueba[] = [];
  loading = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  
  // Variables para búsqueda y filtrado
  terminoBusqueda: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  
  // Variables para la programación de la prueba
  fechaMinima: string = '';
  fecha: string = '';
  horasDisponibles: string[] = [];
  horaSeleccionada: string = '';
  pruebaSeleccionada: Prueba | null = null;
  pruebaSeleccionadaResultado: Prueba | null = null;
  private timeoutId: any;
  
  constructor(
    private pruebaService: PruebaService,
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
          this.pruebasFiltradas = [...this.pruebas];
        } else {
          this.pruebas = [];
          this.pruebasFiltradas = [];
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

    this.http.post<any>('http://localhost:3000/pruebas', datosPrueba)
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
    this.pruebaSeleccionadaResultado = prueba;
    
    // Cargar los archivos de la prueba
    console.log(`Cargando archivos para la prueba ID: ${prueba.id}`);
    this.http.get<any>(`http://localhost:3000/pruebas/${prueba.id}/files`)
      .pipe(
        catchError(error => {
          console.error('Error al cargar archivos de la prueba:', error);
          return of({ files: [] });
        })
      )
      .subscribe(response => {
        console.log('Respuesta de archivos recibida:', response);
        if (response && response.files && this.pruebaSeleccionadaResultado) {
          // Transformar los archivos recibidos al formato esperado por el componente
          const archivos = response.files.map((file: any) => {
            console.log('Procesando archivo:', file);
            return {
              nombre: file.name,
              tipo: this.getMimeType(file.type),
              url: `http://localhost:3000/pruebas/${prueba.id}/files/${file.name}`
            };
          });
          
          // Imprimir las URLs generadas para depuración
          console.log('URLs de archivos generadas:', archivos.map((a: {nombre: string, tipo: string, url: string}) => a.url));
          
          console.log('Archivos procesados:', archivos);
          // Asignar los archivos a la prueba seleccionada
          if (this.pruebaSeleccionadaResultado) {
            if (!this.pruebaSeleccionadaResultado.archivos) {
              this.pruebaSeleccionadaResultado.archivos = [];
            }
            this.pruebaSeleccionadaResultado.archivos = archivos;
            console.log('Archivos asignados a pruebaSeleccionadaResultado:', this.pruebaSeleccionadaResultado.archivos);
          }
        } else if (this.pruebaSeleccionadaResultado) {
          console.log('No se encontraron archivos para esta prueba');
          this.pruebaSeleccionadaResultado.archivos = [];
        }
        
        // Inicializar el offcanvas de Bootstrap después de cargar los archivos
        setTimeout(() => {
          const offcanvasElement = document.getElementById('resultadoOffcanvas');
          if (offcanvasElement) {
            const bsOffcanvas = new bootstrap.Offcanvas(offcanvasElement);
            bsOffcanvas.show();
            console.log('Offcanvas mostrado');
          } else {
            console.error('No se encontró el elemento offcanvas');
          }
        }, 100);
      });
  }

  abrirImagen(url: string) {
    // Abrir la imagen en una nueva ventana
    window.open(url, '_blank');
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  // Métodos para búsqueda y filtrado
  buscarPruebas() {
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.pruebasFiltradas = [...this.pruebas];
  }

  // Método para eliminar un filtro específico
  eliminarFiltro(filtro: 'nombre' | 'fechaInicio' | 'fechaFin') {
    switch(filtro) {
      case 'nombre':
        this.terminoBusqueda = '';
        break;
      case 'fechaInicio':
        this.fechaInicio = '';
        break;
      case 'fechaFin':
        this.fechaFin = '';
        break;
    }
    this.aplicarFiltros();
  }

  // Verificar si hay filtros activos
  hayFiltrosActivos(): boolean {
    return !!(this.terminoBusqueda || this.fechaInicio || this.fechaFin);
  }

  // Método para buscar en tiempo real cuando se escribe en el campo de búsqueda
  buscarEnTiempoReal(event: any) {
    // Implementar debounce para evitar múltiples búsquedas
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.aplicarFiltros();
    }, 300); // Esperar 300ms después de que el usuario deje de escribir
  }

  aplicarFiltros() {
    // Mostrar indicador de carga durante la búsqueda
    const busquedaAnterior = this.pruebasFiltradas.length;
    
    this.pruebasFiltradas = this.pruebas.filter(prueba => {
      // Filtrar por término de búsqueda (nombre del paciente)
      const coincideNombre = !this.terminoBusqueda || 
        prueba.paciente.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      
      // Filtrar por fecha de inicio
      let coincideFechaInicio = true;
      if (this.fechaInicio) {
        const fechaPrueba = new Date(prueba.fecha_creacion);
        const fechaInicioObj = new Date(this.fechaInicio);
        coincideFechaInicio = fechaPrueba >= fechaInicioObj;
      }
      
      // Filtrar por fecha de fin
      let coincideFechaFin = true;
      if (this.fechaFin) {
        const fechaPrueba = new Date(prueba.fecha_creacion);
        const fechaFinObj = new Date(this.fechaFin);
        // Ajustar la fecha de fin para incluir todo el día
        fechaFinObj.setHours(23, 59, 59, 999);
        coincideFechaFin = fechaPrueba <= fechaFinObj;
      }
      
      return coincideNombre && coincideFechaInicio && coincideFechaFin;
    });
    
    // Mostrar mensaje si los resultados cambiaron significativamente
    if (busquedaAnterior > 0 && this.pruebasFiltradas.length === 0) {
      console.log('No se encontraron resultados con los filtros aplicados');
    }
  }

  // Método para determinar el tipo MIME basado en la extensión del archivo
  getMimeType(fileType: string): string {
    if (!fileType) return 'application/octet-stream';
    
    // Si ya viene con formato MIME, devolverlo directamente
    if (fileType.includes('/')) return fileType;
    
    // Mapeo de extensiones comunes a tipos MIME
    const mimeTypes: {[key: string]: string} = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain'
    };
    
    const extension = fileType.toLowerCase();
    return mimeTypes[extension] || 'application/octet-stream';
  }

// Método para descargar un archivo
  descargarArchivo(url: string, nombreArchivo: string) {
    console.log(`Descargando archivo: ${nombreArchivo} desde ${url}`);
    
    // Usar HttpClient en lugar de fetch para beneficiarse del interceptor de autenticación
    this.http.get(url, { responseType: 'blob' })
      .pipe(
        catchError(error => {
          console.error('Error al descargar el archivo:', error);
          alert(`Error al descargar el archivo: ${error.message || 'Error desconocido'}`);
          throw error;
        })
      )
      .subscribe(blob => {
        // Crear un objeto URL para el blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Crear un elemento <a> temporal
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nombreArchivo;
        
        // Añadir el enlace al documento
        document.body.appendChild(link);
        
        // Simular un clic en el enlace
        link.click();
        
        // Eliminar el enlace del documento
        document.body.removeChild(link);
        
        // Liberar el objeto URL
        window.URL.revokeObjectURL(blobUrl);
      });
  }

  // Método para previsualizar un archivo
  previsualizarArchivo(url: string, tipo: string, nombre: string) {
    console.log(`Previsualizando archivo: ${nombre} (${tipo}) desde ${url}`);
    
    if (tipo?.startsWith('image/')) {
      // Para imágenes, ya tenemos el método abrirImagen
      this.abrirImagen(url);
    } else if (tipo === 'application/pdf') {
      // Para PDFs, abrir en una nueva pestaña
      window.open(url, '_blank');
    } else {
      // Para otros tipos de archivos, intentar descargar y abrir
      this.http.get(url, { responseType: 'blob' })
        .pipe(
          catchError(error => {
            console.error('Error al obtener el archivo para previsualización:', error);
            alert(`Error al previsualizar el archivo: ${error.message || 'Error desconocido'}`);
            throw error;
          })
        )
        .subscribe(blob => {
          // Crear un objeto URL para el blob
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Abrir en una nueva ventana
          window.open(blobUrl, '_blank');
          
          // Programar la liberación del objeto URL después de un tiempo
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 60000); // Liberar después de 1 minuto
        });
    }
  }
}