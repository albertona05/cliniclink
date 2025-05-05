import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-detalle-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './detalle-paciente.component.html',
  styleUrls: ['./detalle-paciente.component.css']
})
export class DetallePacienteComponent implements OnInit {
  paciente: any = {};
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.cargarPaciente(params['id']);
      }
    });
  }
  
  cargarPaciente(id: string) {
    this.cargando = true;
    this.mensajeError = '';
    const token = localStorage.getItem('token');
    
    this.http.get<any>(`http://localhost:3000/pacientes/${id}`).subscribe(
      response => {
        if (response) {
          this.paciente = {
            id: response.id,
            nombre: response.nombre,
            email: response.email,
            dni: response.dni,
            telefono: response.telefono,
            fechaNacimiento: response.fechaNacimiento,
            direccion: response.direccion
          };
          console.log(this.paciente);
        } else {
          this.mensajeError = 'Error al cargar los datos del paciente';
        }
        this.cargando = false;
      },
      error => {
        console.error('Error al cargar paciente:', error);
        this.mensajeError = 'Error al cargar los datos del paciente';
        this.cargando = false;
      }
    );
  }

  verCitas() {
    this.router.navigate(['/citas', this.paciente.id]);
  }

  verFacturas() {
    this.router.navigate(['/facturas', this.paciente.id]);
  }

  guardarCambios() {
    this.cargando = true;
    this.mensajeError = '';
    const token = localStorage.getItem('token');

    this.http.put<any>(`http://localhost:3000/pacientes/${this.paciente.id}`, this.paciente).subscribe(
      response => {
        if (response && response.success) {
          this.mensajeExito = 'Usuario actualizado correctamente';
          this.mensajeError = ''; 
        } else {
          this.mensajeError = 'Error al guardar los cambios';
          this.mensajeExito = ''; 
        }
        this.cargando = false;
      },
      error => {
        console.error('Error al guardar cambios:', error);
        this.mensajeError = 'Error al guardar los cambios';
        this.mensajeExito = '';
        this.cargando = false;
      }
    );
  }
}