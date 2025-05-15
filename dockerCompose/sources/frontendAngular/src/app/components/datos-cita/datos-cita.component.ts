import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

    this.citaForm = this.formBuilder.group({
      info: ['', Validators.required],
      medicamentos: [''],
      precio_consulta: ['', [Validators.required, Validators.min(0)]],
      nueva_fecha: [''],
      nueva_hora: [''],
      prueba: [false]
    });
  }

  get f() {
    return this.citaForm.controls;
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
    const datosCita: DatosCita = {
      id_cita: this.idCita,
      info: this.citaForm.value.info,
      medicamentos: this.citaForm.value.medicamentos,
      precio_consulta: this.citaForm.value.precio_consulta
    };

    // Si se ha seleccionado programar una nueva cita
    if (this.citaForm.value.nueva_fecha && this.citaForm.value.nueva_hora) {
      datosCita.nueva_fecha = this.citaForm.value.nueva_fecha;
      datosCita.nueva_hora = this.citaForm.value.nueva_hora;
      // Aquí se podría añadir el ID del médico actual
      datosCita.id_medico = localStorage.getItem('userId') ?? undefined;
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
}


interface DatosCita {
  id_cita: string;
  info: string;
  medicamentos: string;
  precio_consulta: number;
  nueva_fecha?: string;
  nueva_hora?: string;
  id_medico?: string;
}