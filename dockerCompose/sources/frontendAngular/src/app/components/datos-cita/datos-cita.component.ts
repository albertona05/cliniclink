import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MedicoService } from '../../services/medico.service';
import { NavComponent } from '../nav/nav.component';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-datos-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavComponent],
  templateUrl: './datos-cita.component.html',
  styleUrls: ['./datos-cita.component.css']
})
export class DatosCitaComponent implements OnInit {
  citaForm!: FormGroup;
  loading = false;
  submitted = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  idCita: string = '';
  nombrePaciente: string = '';
  dniPaciente: string = '';
  medicos: any[] = [];
  horasDisponibles: string[] = [];
  horaSeleccionada: string = '';
  medicamentos: any[] = [];
  frecuenciasComunes: string[] = ['Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Dos veces al día', 'Tres veces al día'];
  duracionesComunes: string[] = ['3 días', '5 días', '7 días', '10 días', '14 días', '30 días'];
  
  constructor(
    private formBuilder: FormBuilder,
    private medicoService: MedicoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener el ID de la cita de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.idCita = params['id'];
    });
    
    // Obtener el nombre y DNI del paciente de los query params
    this.route.queryParams.subscribe(params => {
      this.nombrePaciente = params['nombre'] || 'Paciente';
      this.dniPaciente = params['dni'] || '';
    });

    // Cargar la lista de médicos y medicamentos
    this.cargarMedicos();
    this.cargarMedicamentos();

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
  
  actualizarNombreMedicamento(index: number) {
    const medicamentoControl = this.medicamentosArray.at(index);
    const idMedicamento = medicamentoControl.get('id_medicamento')?.value;
    
    if (idMedicamento) {
      const medicamentoSeleccionado = this.medicamentos.find(m => m.id.toString() === idMedicamento.toString());
      if (medicamentoSeleccionado) {
        medicamentoControl.get('nombre')?.setValue(medicamentoSeleccionado.nombre);
      }
    }
  }
  
  cargarMedicamentos() {
    this.loading = true;
    this.medicoService.obtenerMedicamentos().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.medicamentos = response.data;
        } else {
          this.medicamentos = [];
          this.mensajeError = 'No se pudieron cargar los medicamentos';
        }
        this.loading = false;
      },
      error: (error) => {
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
      next: (response) => {
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
        
        // Redirigir a la agenda después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/agenda']);
        }, 2000);
      },
      error: (error) => {
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

  volver() {
    this.router.navigate(['/agenda']);
  }

  cargarMedicos() {
    this.medicoService.obtenerMedicos().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.medicos = response.data;
        } else {
          this.medicos = [];
          this.mensajeError = 'No se pudieron cargar los médicos';
        }
      },
      error: (error) => {
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
        next: (response) => {
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
        error: (error) => {
          console.error('Error al consultar disponibilidad:', error);
          this.mensajeError = 'Error al consultar horas disponibles';
          this.loading = false;
        }
      });
  }

  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
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