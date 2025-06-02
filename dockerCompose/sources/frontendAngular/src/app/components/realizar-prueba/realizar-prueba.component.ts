import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { PruebaService } from '../../services/prueba.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-realizar-prueba',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavComponent],
  templateUrl: './realizar-prueba.component.html',
  styleUrls: ['./realizar-prueba.component.css']
})
export class RealizarPruebaComponent implements OnInit {
  private apiUrl = 'http://localhost:3000';
  pruebaForm!: FormGroup;
  loading = false;
  submitted = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  idPrueba: string = '';
  nombrePaciente: string = '';
  dniPaciente: string = '';
  tipoPrueba: string = '';
  selectedFiles: File[] = [];
  uploadedFiles: any[] = [];
  uploadProgress: number = 0;
  
  constructor(
    private formBuilder: FormBuilder,
    private pruebaService: PruebaService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Obtener el ID de la prueba y otros datos de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.idPrueba = params['id'];
      console.log(`Inicializando componente para la prueba ID: ${this.idPrueba}`);
    });
    
    // Obtener información adicional de los query params
    this.route.queryParams.subscribe(params => {
      this.nombrePaciente = params['nombre'] || 'Paciente';
      this.dniPaciente = params['dni'] || '';
      this.tipoPrueba = params['tipo'] || 'Prueba médica';
      console.log('Datos del paciente cargados:', {
        nombre: this.nombrePaciente,
        dni: this.dniPaciente,
        tipoPrueba: this.tipoPrueba
      });
    });

    // Inicializar el formulario
    this.pruebaForm = this.formBuilder.group({
      resultado: ['', Validators.required]
    });
    console.log('Formulario inicializado');
  }

  get f() {
    return this.pruebaForm.controls;
  }

  getErrorMessage(field: string): string {
    if (this.f[field].errors?.['required']) {
      return 'Este campo es obligatorio';
    }
    return 'Campo inválido';
  }

  onFileSelected(event: any): void {
    console.log('Evento de selección de archivos activado');
    const files = event.target.files;
    if (files) {
      console.log(`Se seleccionaron ${files.length} archivos`);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Procesando archivo: ${file.name} (${file.type}, ${file.size} bytes)`);
        
        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
          this.mensajeError = `El archivo ${file.name} excede el tamaño máximo permitido (5MB)`;
          console.error(`Archivo rechazado por tamaño: ${file.name} (${file.size} bytes)`);
          continue;
        }
        // Validar tipo (imágenes y PDF)
        const fileType = file.type.toLowerCase();
        if (!fileType.includes('image/') && fileType !== 'application/pdf') {
          this.mensajeError = `El archivo ${file.name} no es un formato permitido (JPG, PNG, PDF)`;
          console.error(`Archivo rechazado por tipo: ${file.name} (${fileType})`);
          continue;
        }
        console.log(`Archivo aceptado: ${file.name}`);
        this.selectedFiles.push(file);
      }
      console.log(`Total de archivos seleccionados: ${this.selectedFiles.length}`);
    }
  }

  uploadFiles(): void {
    if (this.selectedFiles.length === 0) {
      console.warn('No hay archivos seleccionados para subir');
      return;
    }
    
    console.log(`Iniciando subida de ${this.selectedFiles.length} archivos para la prueba ID: ${this.idPrueba}`);
    this.uploadProgress = 0;
    this.loading = true;
    this.mensajeError = '';
  
    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      console.log(`Añadiendo archivo al FormData: ${file.name} (${file.type}, ${file.size} bytes)`);
      formData.append('files', file);
    });
    
    // Verificar contenido del FormData (solo para depuración)
    console.log('Contenido del FormData:');
    for (const pair of (formData as any).entries()) {
      console.log(`- ${pair[0]}: ${pair[1].name} (${pair[1].type}, ${pair[1].size} bytes)`);
    }
      
    // Enviar archivos al servidor FTP a través del endpoint de archivos
    console.log(`Enviando petición POST a ${this.apiUrl}/pruebas/${this.idPrueba}/files`);
    this.http.post<any>(`${this.apiUrl}/pruebas/${this.idPrueba}/files`, formData, {
      reportProgress: true,
      observe: 'events'
    })
      .pipe(
        catchError(error => {
          console.error('Error al subir archivos:', error);
          console.error('Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.mensajeError = `Error al subir los archivos: ${error.message || error.statusText || 'Error desconocido'}`;
          return of(null);
        }),
        finalize(() => {
          console.log('Finalizada la operación de subida de archivos');
          this.loading = false;
        })
      )
      .subscribe(event => {
        if (event) {
          // Manejar eventos de progreso
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
            console.log(`Progreso de subida: ${this.uploadProgress}%`);
          }
          
          // Manejar respuesta final
          if (event.type === HttpEventType.Response) {
            const response = event.body;
            console.log('Respuesta del servidor:', response);
            
            if (response && response.files) {
              this.uploadedFiles = response.files.map((file: any) => {
                console.log(`Archivo subido: ${file.filename || file.originalName}`);
                return {
                  nombre: file.filename || file.originalName,
                  tipo: file.type,
                  url: `${this.apiUrl}/pruebas/${this.idPrueba}/files/${file.filename || file.storedName}`
                };
              });
              this.selectedFiles = [];
              this.mensajeExito = 'Archivos subidos correctamente';
              setTimeout(() => this.mensajeExito = '', 3000);
            } else {
              console.warn('Respuesta del servidor sin archivos o en formato inesperado:', response);
            }
          }
        }
      });
  }

  removeFile(index: number): void {
    console.log(`Eliminando archivo del índice ${index}: ${this.uploadedFiles[index]?.nombre}`);
    this.uploadedFiles.splice(index, 1);
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'bi bi-file-image';
    } else if (extension === 'pdf') {
      return 'bi bi-file-pdf';
    }
    return 'bi bi-file-earmark';
  }

  onSubmit(): void {
    this.submitted = true;
    console.log('Formulario enviado');
    
    if (this.pruebaForm.invalid) {
      console.warn('Formulario inválido, no se puede enviar');
      return;
    }
  
    this.loading = true;
    this.mensajeError = '';
    this.mensajeExito = '';
  
    // Preparar datos para enviar
    const datosPrueba = {
      id_prueba: this.idPrueba,
      resultado: this.pruebaForm.value.resultado,
      archivos: this.uploadedFiles.map(file => ({
        nombre: file.nombre,
        tipo: file.tipo,
        url: file.url
      }))
    };
    
    console.log('Datos a enviar:', datosPrueba);
  
    // Enviar datos al servicio
    this.pruebaService.finalizarPrueba(datosPrueba)
      .pipe(
        catchError(error => {
          console.error('Error al finalizar prueba:', error);
          console.error('Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.mensajeError = error.error?.mensaje || `Error al finalizar la prueba: ${error.message || error.statusText || 'Error desconocido'}`;
          return of(null);
        }),
        finalize(() => {
          console.log('Finalizada la operación de finalizar prueba');
          this.loading = false;
        })
      )
      .subscribe(response => {
        if (response) {
          console.log('Prueba finalizada correctamente:', response);
          this.mensajeExito = 'Prueba finalizada correctamente';
          // Redirigir después de un breve retraso
          setTimeout(() => {
            console.log('Redirigiendo a la página de agenda');
            this.router.navigate(['/agenda']);
          }, 2000);
        }
      });
  }

  volver(): void {
    console.log('Volviendo a la página de agenda');
    this.router.navigate(['/agenda']);
  }
}