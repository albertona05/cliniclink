import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MedicoService } from '../../services/medico.service';
import { PruebaService } from '../../services/prueba.service';
import { NavComponent } from '../nav/nav.component';
import { catchError, finalize, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-datos-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavComponent],
  templateUrl: './datos-cita.component.html',
  styleUrls: ['./datos-cita.component.css']
})
export class DatosCitaComponent implements OnInit {
  citaForm!: FormGroup;
  pruebaForm!: FormGroup;
  loading = false;
  submitted = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  idCita: string = '';
  nombrePaciente: string = '';
  dniPaciente: string = '';
  idUsuarioPaciente: string = '';
  medicos: any[] = [];
  horasDisponibles: string[] = [];
  horaSeleccionada: string = '';
  fechaMinima: string = new Date().toISOString().split('T')[0];
  horasDisponiblesPrueba: string[] = [];
  horaPruebaSeleccionada: string = '';
  medicamentos: any[] = [];
  medicamentosResultados: any[] = [];
  medicamentoSeleccionadoIndex: number = -1;
  busquedaTermino = new Subject<{termino: string, index: number}>();
  frecuenciasComunes: string[] = ['Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Dos veces al día', 'Tres veces al día'];
  duracionesComunes: string[] = ['3 días', '5 días', '7 días', '10 días', '14 días', '30 días'];
  mostrarFormPrueba: boolean = false;
  tiposPrueba: string[] = ['Análisis de sangre', 'Radiografía', 'Ecografía', 'Electrocardiograma', 'Resonancia magnética', 'TAC', 'Otros'];
  private apiUrl = environment.apiUrl;
  
  constructor(
    private formBuilder: FormBuilder,
    private medicoService: MedicoService,
    private pruebaService: PruebaService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  consultarHorasDisponiblesPrueba() {
    if (!this.pruebaForm.get('fecha_prueba')?.value || !this.pruebaForm.get('id_medicoAsignado')?.value) {
      this.mensajeError = 'Seleccione una fecha y un médico';
      return;
    }

    this.loading = true;
    this.medicoService.obtenerHorasLibres(
      this.pruebaForm.get('id_medicoAsignado')?.value,
      this.pruebaForm.get('fecha_prueba')?.value
    ).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data && response.data.horas_disponibles) {
          this.horasDisponiblesPrueba = response.data.horas_disponibles;
          if (this.horasDisponiblesPrueba.length === 0) {
            this.mensajeError = 'No hay horas disponibles para la fecha seleccionada';
          }
        } else {
          this.horasDisponiblesPrueba = [];
          this.mensajeError = 'No se pudieron cargar las horas disponibles';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al consultar horas disponibles:', error);
        this.mensajeError = 'Error al consultar las horas disponibles';
        this.loading = false;
      }
    });
  }

  seleccionarHoraPrueba(hora: string) {
    this.horaPruebaSeleccionada = hora;
  }

  ngOnInit(): void {
    // Configurar el observable para la búsqueda de medicamentos con debounce
    this.busquedaTermino.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => prev.termino === curr.termino)
    ).subscribe(({termino, index}) => {
      if (termino.length > 2) {
        this.realizarBusquedaMedicamentos(termino, index);
      } else {
        this.medicamentosResultados = [];
      }
    });

    // Obtener el ID de la cita de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.idCita = params['id'];
    });
    
    // Obtener el nombre y DNI del paciente de los query params
    this.route.queryParams.subscribe(params => {
      this.nombrePaciente = params['nombre'] || 'Paciente';
      this.dniPaciente = params['dni'] || '';
      console.log('DNI obtenido de queryParams:', this.dniPaciente);
    });
    
    // Inicializar formulario para solicitar pruebas (solo una vez)
    this.pruebaForm = this.formBuilder.group({
      id_medicoAsignado: ['', Validators.required],
      tipo_prueba: ['', Validators.required],
      descripcion: [''],
      fecha_prueba: ['', Validators.required]
    });
  
    // Cargar la lista de médicos y medicamentos
    this.cargarMedicos();
    this.cargarMedicamentos();
    
    // Obtener información de la cita actual
    this.obtenerDatosCita();
  
    this.citaForm = this.formBuilder.group({
      info: ['', Validators.required],
      medicamentosArray: this.formBuilder.array([]),
      precio_consulta: ['', [Validators.required, Validators.min(0)]],
      nueva_fecha: [''],
      id_medico: [''],
    });
  }

  get f() {
    return this.citaForm.controls;
  }
  
  get medicamentosArray() {
    return this.citaForm.get('medicamentosArray') as FormArray;
  }
  
  // Método para obtener un medicamento como FormGroup en lugar de AbstractControl
  getMedicamentoFormGroup(index: number): FormGroup {
    return this.medicamentosArray.at(index) as FormGroup;
  }
  
  agregarMedicamento() {
    this.medicamentosArray.push(this.formBuilder.group({
      id_medicamento: ['', Validators.required],
      nombre_medicamento: ['', Validators.required],
      nombre: [''],
      dosis: ['1 comprimido', Validators.required],
      frecuencia: ['Cada 8 horas', Validators.required],
      duracion: ['7 días', Validators.required],
      instrucciones: [''] 
    }));
  }
  
  eliminarMedicamento(index: number) {
    this.medicamentosArray.removeAt(index);
  }
  
  buscarMedicamentos(index: number) {
    const medicamentoControl = this.getMedicamentoFormGroup(index);
    const termino = medicamentoControl.get('nombre_medicamento')?.value;
    
    if (termino) {
      this.medicamentoSeleccionadoIndex = index;
      this.busquedaTermino.next({termino, index});
    } else {
      this.medicamentosResultados = [];
    }
  }

  realizarBusquedaMedicamentos(termino: string, index: number) {
    this.medicoService.buscarMedicamentos(termino).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.medicamentosResultados = response.data;
        } else {
          this.medicamentosResultados = [];
        }
      },
      error: (error: any) => {
        console.error('Error al buscar medicamentos:', error);
        this.medicamentosResultados = [];
      }
    });
  }

  seleccionarMedicamento(index: number, medicamento: any) {
    const medicamentoControl = this.getMedicamentoFormGroup(index);
    medicamentoControl.patchValue({
      id_medicamento: medicamento.id,
      nombre_medicamento: medicamento.nombre,
      nombre: medicamento.nombre
    });
    this.medicamentosResultados = [];
  }

  crearNuevoMedicamento(index: number) {
    const medicamentoControl = this.getMedicamentoFormGroup(index);
    const nombreMedicamento = medicamentoControl.get('nombre_medicamento')?.value;
    
    if (!nombreMedicamento) {
      this.mensajeError = 'Debe ingresar un nombre para el medicamento';
      return;
    }

    this.loading = true;
    this.medicoService.crearMedicamento({nombre: nombreMedicamento}).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          const nuevoMedicamento = response.data;
          this.medicamentos.push(nuevoMedicamento);
          this.seleccionarMedicamento(index, nuevoMedicamento);
          this.mensajeExito = 'Medicamento creado exitosamente';
        } else {
          this.mensajeError = 'No se pudo crear el medicamento';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al crear medicamento:', error);
        if (error.error && error.error.mensaje) {
          this.mensajeError = error.error.mensaje;
        } else {
          this.mensajeError = 'Error al crear el medicamento';
        }
        this.loading = false;
      }
    });
  }
  
  cargarMedicamentos() {
    this.loading = true;
    this.medicoService.obtenerMedicamentos().subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.medicamentos = response.data;
        } else {
          this.medicamentos = [];
          this.mensajeError = 'No se pudieron cargar los medicamentos';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar medicamentos:', error);
        this.mensajeError = 'Error al cargar la lista de medicamentos';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    this.submitted = true;

    if (this.citaForm.invalid) {
      return;
    }

    this.loading = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    // Preparar los datos para enviar al backend
    const medicamentosFormateados = this.medicamentosArray.value.map((med: any) => ({
      id_medicamento: med.id_medicamento,
      nombre: med.nombre,
      dosis: med.dosis,
      frecuencia: med.frecuencia,
      duracion: med.duracion,
      instrucciones: med.instrucciones
    }));
    
    const datosCita: DatosCita = {
      id_cita: this.idCita,
      info: this.citaForm.value.info,
      medicamentos: medicamentosFormateados,
      precio_consulta: this.citaForm.value.precio_consulta
    };

    // Si se ha seleccionado programar una nueva cita
    if (this.citaForm.value.nueva_fecha && this.citaForm.value.id_medico) {
      datosCita.nueva_fecha = this.citaForm.value.nueva_fecha;
      datosCita.id_medico = this.citaForm.value.id_medico;

      // Añadir la hora seleccionada si existe
      if (this.horaSeleccionada) {
        datosCita.nueva_hora = this.horaSeleccionada;
      } else if (this.horasDisponibles.length > 0) {
        this.mensajeError = 'Debe seleccionar una hora para la nueva cita';
        this.loading = false;
        return;
      }
    }

    this.medicoService.finalizarCita(datosCita).subscribe({
      next: (response: any) => {
        this.mensajeExito = 'Cita finalizada exitosamente';
        if (response.receta_path) {
          this.mensajeExito += '. Se ha generado una receta médica.';
        }
        if (response.factura_path) {
          this.mensajeExito += '. Se ha generado una factura.';
        }
        if (response.nueva_cita) {
          this.mensajeExito += '. Se ha programado una nueva cita.';
        }
        this.loading = false;

        // Descargar automáticamente los documentos generados
        if (response.documentos_generados && response.documentos_generados.length > 0) {
          // Pequeña pausa para asegurar que los documentos estén listos
          setTimeout(() => {
            response.documentos_generados.forEach((documento: any) => {
              // Usar HttpClient para obtener el archivo como blob
              this.http.get(`${this.apiUrl}${documento.url}`, { responseType: 'blob' })
                .pipe(
                  catchError(error => {
                    console.error(`Error al descargar ${documento.nombre}:`, error);
                    return of(null);
                  })
                )
                .subscribe(blob => {
                  if (blob) {
                    // Crear un objeto URL para el blob
                    const blobUrl = window.URL.createObjectURL(blob);
                    
                    // Crear un elemento <a> temporal
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = documento.nombre;
                    
                    // Añadir el enlace al documento
                    document.body.appendChild(link);
                    
                    // Simular un clic en el enlace
                    link.click();
                    
                    // Eliminar el enlace del documento
                    document.body.removeChild(link);
                    
                    // Liberar el objeto URL
                    window.URL.revokeObjectURL(blobUrl);
                  }
                });
            });
          }, 1000);
        }

        // Redirigir a la agenda después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/agenda']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error al finalizar cita:', error);
        if (error.error && error.error.mensaje) {
          this.mensajeError = error.error.mensaje;
        } else {
          this.mensajeError = 'Error al finalizar la cita';
        }
        this.loading = false;
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.citaForm.get(field);

    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['min']) {
        return 'El valor debe ser mayor o igual a 0';
      }
    }
    return '';
  }

  obtenerDatosCita() {
    if (!this.idCita) {
      this.mensajeError = 'No se pudo obtener el ID de la cita';
      return;
    }

    this.loading = true;
    this.http.get(`${this.apiUrl}/cita/${this.idCita}`)
      .subscribe({
        next: (response: any) => {
          if (response && response.success && response.data) {
            const cita = response.data;
            if (cita.paciente && cita.paciente.id_usuario) {
              this.idUsuarioPaciente = cita.paciente.id_usuario;
              console.log('ID de usuario del paciente obtenido:', this.idUsuarioPaciente);
            }
          } else {
            console.error('Respuesta inválida al obtener datos de la cita');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener datos de la cita:', error);
          this.loading = false;
        }
      });
  }

  volver() {
    console.log('ID de usuario del paciente en volver():', this.idUsuarioPaciente);
    
    // Navegar al historial del paciente usando el ID de usuario
    if (this.idUsuarioPaciente) {
      this.router.navigate(['/historial-paciente', this.idUsuarioPaciente]);
    } else if (this.dniPaciente) {
      // Fallback al comportamiento anterior si no tenemos el ID de usuario
      console.log('Usando DNI como fallback:', this.dniPaciente);
      this.router.navigate(['/historial-paciente', this.dniPaciente], {
        queryParams: {
          nombre: this.nombrePaciente
        }
      });
    } else {
      console.log('No se encontró información del paciente, redirigiendo a agenda');
      this.router.navigate(['/agenda']);
    }
  }

  cargarMedicos() {
    this.medicoService.obtenerMedicos().subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.medicos = response.data;
        } else {
          this.medicos = [];
          this.mensajeError = 'No se pudieron cargar los médicos';
        }
      },
      error: (error: any) => {
        console.error('Error al cargar médicos:', error);
        this.mensajeError = 'Error al cargar la lista de médicos';
      }
    });
  }

  consultarHorasDisponibles() {
    if (!this.citaForm.value.nueva_fecha || !this.citaForm.value.id_medico) {
      this.mensajeError = 'Debe seleccionar fecha y médico';
      return;
    }

    this.loading = true;
    this.mensajeError = '';
    this.horasDisponibles = [];
    this.horaSeleccionada = '';

    this.medicoService.obtenerHorasLibres(this.citaForm.value.id_medico, this.citaForm.value.nueva_fecha)
      .subscribe({
        next: (response: any) => {
          if (response && response.success && response.data && response.data.horas_disponibles) {
            this.horasDisponibles = response.data.horas_disponibles;
            if (this.horasDisponibles.length === 0) {
              this.mensajeError = 'No hay horas disponibles para la fecha seleccionada';
            }
          } else {
            this.mensajeError = 'No se pudieron obtener las horas disponibles';
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error al consultar disponibilidad:', error);
          this.mensajeError = 'Error al consultar horas disponibles';
          this.loading = false;
        }
      });
  }

  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }
  
  // Mostrar/ocultar formulario de prueba
  toggleFormPrueba() {
    this.mostrarFormPrueba = !this.mostrarFormPrueba;
    if (!this.mostrarFormPrueba) {
      this.pruebaForm.reset();
    }
  }
  
  // Solicitar una prueba médica
  solicitarPrueba() {
    if (this.pruebaForm.invalid) {
      return;
    }

    const fechaPrueba = this.pruebaForm.get('fecha_prueba')?.value;
    if (!fechaPrueba) {
      this.mensajeError = 'Debe seleccionar una fecha para la prueba';
      return;
    }

    if (!this.horaPruebaSeleccionada) {
      this.mensajeError = 'Debe seleccionar una hora disponible';
      return;
    }
    
    this.loading = true;
    this.mensajeError = '';
    
    console.log('Fecha de prueba seleccionada:', fechaPrueba);
    console.log('Hora de prueba seleccionada:', this.horaPruebaSeleccionada);
    const datosPrueba = {
      id_cita: this.idCita,
      id_medicoAsignado: this.pruebaForm.value.id_medicoAsignado,
      tipo_prueba: this.pruebaForm.value.tipo_prueba,
      descripcion: this.pruebaForm.value.descripcion,
      fecha_prueba: fechaPrueba,
      hora_prueba: this.horaPruebaSeleccionada
    };
    
    this.pruebaService.crearPrueba(datosPrueba).subscribe({
      next: (response: any) => {
        this.mensajeExito = 'Prueba solicitada exitosamente';
        this.loading = false;
        this.mostrarFormPrueba = false;
        this.pruebaForm.reset();
      },
      error: (error: any) => {
        console.error('Error al solicitar prueba:', error);
        this.mensajeError = error.error?.mensaje || 'Error al solicitar la prueba';
        this.loading = false;
      }
    });
  }
}


interface DatosCita {
  id_cita: string;
  info: string;
  medicamentos: string;
  precio_consulta: number;
  nueva_fecha?: string;
  id_medico?: string;
  nueva_hora?: string;
}