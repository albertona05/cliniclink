import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
    });
    
    // Obtener información adicional de los query params
    this.route.queryParams.subscribe(params => {
      this.nombrePaciente = params['nombre'] || 'Paciente';
      this.dniPaciente = params['dni'] || '';
      this.tipoPrueba = params['tipo'] || 'Prueba médica';
    });

    // Inicializar el formulario
    this.pruebaForm = this.formBuilder.group({
      resultado: ['', Validators.required]
    });
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
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
          this.mensajeError = `El archivo ${file.name} excede el tamaño máximo permitido (5MB)`;
          continue;
        }
        // Validar tipo (imágenes y PDF)
        const fileType = file.type.toLowerCase();
        if (!fileType.includes('image/') && fileType !== 'application/pdf') {
          this.mensajeError = `El archivo ${file.name} no es un formato permitido (JPG, PNG, PDF)`;
          continue;
        }
        this.selectedFiles.push(file);
      }
    }
  }

  uploadFiles(): void {
    if (this.selectedFiles.length === 0) return;
    
    this.uploadProgress = 0;
    this.loading = true;
    this.mensajeError = '';
  
    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file);
    });
      
    // Enviar archivos al servidor FTP a través del endpoint de archivos
    this.http.post<any>(`${this.apiUrl}/pruebas/${this.idPrueba}/files`, formData)
      .pipe(
        catchError(error => {
          console.error('Error al subir archivos:', error);
          this.mensajeError = 'Error al subir los archivos';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        if (response && response.files) {
          this.uploadedFiles = response.files.map((file: any) => ({
            nombre: file.originalName,
            tipo: file.type,
            url: `${this.apiUrl}/pruebas/${this.idPrueba}/files/${file.storedName}`
          }));
          this.selectedFiles = [];
          this.mensajeExito = 'Archivos subidos correctamente';
          setTimeout(() => this.mensajeExito = '', 3000);
        }
      });
  }

  removeFile(index: number): void {
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
    
    if (this.pruebaForm.invalid) {
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
  
    // Enviar datos al servicio
    this.pruebaService.finalizarPrueba(datosPrueba)
      .pipe(
        catchError(error => {
          console.error('Error al finalizar prueba:', error);
          this.mensajeError = error.error?.mensaje || 'Error al finalizar la prueba';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(response => {
        if (response) {
          this.mensajeExito = 'Prueba finalizada correctamente';
          // Redirigir después de un breve retraso
          setTimeout(() => {
            this.router.navigate(['/agenda']);
          }, 2000);
        }
      });
  }

  volver(): void {
    this.router.navigate(['/agenda']);
  }
}