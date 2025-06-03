import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicoService } from '../../services/medico.service';
import { NavComponent } from '../nav/nav.component';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-registrar-medico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavComponent],
  templateUrl: './registrar-medico.component.html',
  styleUrls: ['./registrar-medico.component.css']
})
export class RegistrarMedicoComponent implements OnInit {
  registroForm!: FormGroup;
  loading = false;
  submitted = false;
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private medicoService: MedicoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.registroForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      especialidad: ['', Validators.required],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasena: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para confirmar que las contraseñas coincidan
  passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
    const contrasena = control.get('contrasena');
    const confirmarContrasena = control.get('confirmarContrasena');
    
    if (contrasena && confirmarContrasena && contrasena.value !== confirmarContrasena.value) {
      return { 'passwordMismatch': true };
    }
    return null;
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
    
    const formData = {
      nombre: this.registroForm.value.nombre,
      email: this.registroForm.value.email,
      especialidad: this.registroForm.value.especialidad,
      contrasena: this.registroForm.value.contrasena
    };

    this.medicoService.registrarMedico(formData).subscribe({
      next: (response) => {
        this.mensajeExito = 'Médico registrado exitosamente';
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
          this.mensajeError = 'Error al registrar el médico';
        }
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/']);
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
    }
    
    // Verificar error de contraseñas no coincidentes
    if (field === 'confirmarContrasena' && this.registroForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    
    return '';
  }
}