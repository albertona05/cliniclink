import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { HistorialService } from '../../services/historial.service';
import { BotonVolverComponent } from '../boton-volver/boton-volver.component';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Verificar autenticación antes de cargar datos
    if (!this.authService.isLoggedIn()) {
      this.mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      this.router.navigate(['/login']);
      return;
    }

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
          if (error.status === 401) {
            this.mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
            this.authService.logout().subscribe();
          } else {
            this.mensajeError = 'Error al cargar el historial del paciente';
          }
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
          
          // Cargar archivos para las pruebas médicas
          this.cargarArchivosParaPruebas();
          
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

  irALogin(): void {
    this.router.navigate(['/login']);
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

  /**
   * Carga los archivos adjuntos para las pruebas médicas
   */
  cargarArchivosParaPruebas(): void {
    const pruebas = this.historialCitas.filter(cita => cita.tipo === 'prueba');
    console.log('Cargando archivos para pruebas:', pruebas.length, 'pruebas encontradas');
    
    pruebas.forEach(prueba => {
      console.log(`Solicitando archivos para prueba ID: ${prueba.id}`);
      this.http.get<any>(`http://localhost:3000/pruebas/${prueba.id}/files`)
        .pipe(
          catchError(error => {
            console.error(`Error al cargar archivos para la prueba ${prueba.id}:`, error);
            if (error.status === 401) {
              console.log('Error de autenticación detectado en carga de archivos');
              this.mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
              this.authService.logout().subscribe();
            }
            return of({ files: [] });
          })
        )
        .subscribe(response => {
          console.log(`Respuesta para prueba ${prueba.id}:`, response);
          if (response && response.files) {
            prueba.archivos = response.files.map((file: any) => ({
              nombre: file.name,
              tipo: this.getMimeType(file.type),
              url: `http://localhost:3000/pruebas/${prueba.id}/files/${file.name}`
            }));
            console.log(`Archivos asignados a prueba ${prueba.id}:`, prueba.archivos);
          } else {
            prueba.archivos = [];
            console.log(`No se encontraron archivos para prueba ${prueba.id}`);
          }
        });
    });
  }

  /**
   * Obtiene el tipo MIME basado en la extensión del archivo
   */
  getMimeType(type: string): string {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[type.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Abre una imagen en una nueva ventana
   */
  abrirImagen(url: string): void {
    window.open(url, '_blank');
  }

  /**
   * Verifica si hay archivos que no sean imágenes
   */
  tieneArchivosNoImagen(archivos: any[]): boolean {
    return archivos.some(archivo => !archivo.tipo?.startsWith('image/'));
  }

  /**
   * Obtiene el icono apropiado para el tipo de archivo
   */
  getFileIcon(tipo: string): string {
    if (tipo?.includes('pdf')) {
      return 'bi-file-earmark-pdf';
    } else if (tipo?.includes('image')) {
      return 'bi-file-earmark-image';
    } else if (tipo?.includes('text')) {
      return 'bi-file-earmark-text';
    } else {
      return 'bi-file-earmark';
    }
  }

  /**
   * Previsualiza un archivo
   */
  previsualizarArchivo(url: string, tipo: string, nombre: string): void {
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

  /**
   * Descarga un archivo
   */
  descargarArchivo(url: string, nombreArchivo: string): void {
    console.log(`Descargando archivo: ${nombreArchivo} desde ${url}`);
    
    this.http.get(url, { responseType: 'blob' })
      .pipe(
        catchError(error => {
          console.error('Error al descargar el archivo:', error);
          alert(`Error al descargar el archivo: ${error.message || 'Error desconocido'}`);
          throw error;
        })
      )
      .subscribe(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      });
  }
}