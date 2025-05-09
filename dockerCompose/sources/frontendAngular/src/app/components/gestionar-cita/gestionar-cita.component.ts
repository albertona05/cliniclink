import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../nav/nav.component';

interface Medico {
  id: number;
  nombre: string;
  especialidad: string;
}

@Component({
  selector: 'gestionar-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavComponent],
  templateUrl: './gestionar-cita.component.html',
  styleUrls: ['./gestionar-cita.component.css']
})
export class GestionarCitaComponent implements OnInit {
  citaForm: FormGroup;
  medicos: Medico[] = [];
  horasDisponibles: string[] = [];
  horaSeleccionada: string = '';
  submitted = false;
  loading = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.citaForm = this.formBuilder.group({
      fecha: ['', [Validators.required]],
      medico: ['', [Validators.required]],
      paciente: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // Simular carga de médicos
    this.medicos = [
      { id: 1, nombre: 'Dr. Juan Pérez', especialidad: 'Cardiología' },
      { id: 2, nombre: 'Dra. María García', especialidad: 'Pediatría' },
      { id: 3, nombre: 'Dr. Carlos López', especialidad: 'Dermatología' }
    ];

    // Simular horas disponibles
    this.horasDisponibles = [
      '09:00', '09:30', '10:00', '10:30', '11:00',
      '11:30', '12:00', '15:00', '15:30', '16:00'
    ];

    // Suscribirse a cambios en el formulario
    this.citaForm.get('fecha')?.valueChanges.subscribe(() => {
      this.horaSeleccionada = '';
    });

    this.citaForm.get('medico')?.valueChanges.subscribe(() => {
      this.horaSeleccionada = '';
    });
  }

  // Getter para acceder fácilmente a los campos del formulario
  get f() {
    return this.citaForm.controls;
  }

  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }

  getErrorMessage(field: string): string {
    if (this.f[field].errors) {
      if (this.f[field].errors['required']) {
        return 'Este campo es requerido';
      }
    }
    return '';
  }

  onSubmit() {
    this.submitted = true;

    if (this.citaForm.invalid || !this.horaSeleccionada) {
      if (!this.horaSeleccionada) {
        this.mensajeError = 'Por favor seleccione una hora disponible';
      }
      return;
    }

    this.loading = true;
    this.mensajeError = '';

    // Simular el proceso de reserva
    setTimeout(() => {
      this.loading = false;
      this.mensajeExito = 'Cita reservada exitosamente';
      
      // Resetear el formulario después de 2 segundos
      setTimeout(() => {
        this.submitted = false;
        this.citaForm.reset();
        this.horaSeleccionada = '';
        this.mensajeExito = '';
      }, 2000);
    }, 1500);
  }
}