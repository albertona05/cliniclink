import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { PacienteService } from '../../services/paciente.service';
import { NavComponent } from '../nav/nav.component';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-registrar-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavComponent],
  templateUrl: './registrar-paciente.component.html',
  styleUrls: ['./registrar-paciente.component.css']
})
export class RegistrarPacienteComponent implements OnInit {
  registroForm!: FormGroup;
  loading = false;
  submitted = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  contrasenaGenerada = '';

  constructor(
    private formBuilder: FormBuilder,
    private pacienteService: PacienteService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.registroForm = this.formBuilder.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}[A-Za-z]$')]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      direccion: ['', Validators.required],
      fechaNacimiento: ['', [Validators.required, RegistrarPacienteComponent.fechaAnteriorAHoyValidator]]
    });
  }

  // En Angular 19, es mejor usar funciones de validación estáticas
  static fechaAnteriorAHoyValidator(control: AbstractControl): {[key: string]: any} | null {
    const fechaIngresada = new Date(control.value);
    const fechaHoy = new Date();
    return fechaIngresada >= fechaHoy ? {'fechaInvalida': true} : null;
  }

  get f() {
    return this.registroForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.registroForm.invalid) {
      return;
    }

    this.loading = true;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.pacienteService.registrarPaciente(this.registroForm.value).subscribe({
      next: (response) => {
        this.contrasenaGenerada = response.contrasenaGenerada || '';
        this.mensajeExito = `Paciente registrado exitosamente. La contraseña generada es: ${this.contrasenaGenerada}. Por favor, anote esta contraseña ya que será necesaria para el primer acceso del paciente.`;
        this.loading = false;
        // Resetear el formulario después de un registro exitoso
        this.registroForm.reset();
        this.submitted = false;
      },
      error: (error) => {
        if (error.mensaje) {
          console.log(error)
          this.mensajeError = error.mensaje;
        } else {
          this.mensajeError = 'Error al registrar el paciente';
        }
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/buscar-paciente']);
  }

  getErrorMessage(field: string): string {
    const control = this.registroForm.get(field);
    
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['email']) {
        return 'Ingrese un correo electrónico válido';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['pattern']) {
        return 'Formato inválido';
      }
      if (control.errors['fechaInvalida']) {
        return 'La fecha debe ser anterior a hoy';
      }
    }
    return '';
  }
}