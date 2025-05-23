import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { CitaService } from '../../services/cita.service';
import { catchError, finalize, of } from 'rxjs';
import { BotonVolverComponent } from '../boton-volver/boton-volver.component';

@Component({
  selector: 'app-citas-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent, BotonVolverComponent],
  templateUrl: './citas-paciente.component.html',
  styleUrls: ['./citas-paciente.component.css']
})
export class CitasPacienteComponent implements OnInit {
  citas: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';
  idPaciente: string = '';
  
  constructor(
    private citaService: CitaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.idPaciente = this.route.snapshot.paramMap.get('id') || '';
    if (this.idPaciente) {
      this.cargarCitas();
    } else {
      this.mensajeError = 'ID de paciente no proporcionado';
    }
  }
  
  cargarCitas(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    
    this.citaService.obtenerCitasPaciente(this.idPaciente)
      .pipe(
        catchError(error => {
          console.error('Error al cargar citas:', error);
          this.mensajeError = 'Error al cargar las citas del paciente';
          return of([]);
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(citas => {
        this.citas = citas;

        // Ordenar todas las citas de la más temprana a la más tardía
        this.citas.sort((a, b) => {
          try {
            // Asegurar que la fecha tenga el formato correcto (YYYY-MM-DD)
            const fechaA_str = a.fecha.split('T')[0];
            const fechaB_str = b.fecha.split('T')[0];
            
            // Asegurar que la hora tenga el formato correcto (HH:mm)
            const horaA = a.hora.split(':').slice(0, 2).join(':');
            const horaB = b.hora.split(':').slice(0, 2).join(':');
            
            // Crear objetos Date con las fechas y horas combinadas
            const fechaA = new Date(`${fechaA_str}T${horaA}`);
            const fechaB = new Date(`${fechaB_str}T${horaB}`);
            
            // Verificar que las fechas sean válidas
            if (isNaN(fechaA.getTime()) || isNaN(fechaB.getTime())) {
              console.error('Fecha inválida detectada durante ordenamiento');
              return 0; // Mantener el orden original si hay fechas inválidas
            }
            
            return fechaB.getTime() - fechaA.getTime(); // Orden descendente
          } catch (error) {
            console.error('Error al ordenar citas:', error);
            return 0; // Mantener el orden original en caso de error
          }
        });
      });
  }
  
  esFechaFutura(fecha: string, hora: string): boolean {
    // Validar que la fecha y hora no estén vacías
    if (!fecha || !hora) {
      return false;
    }

    try {
      // Extraer solo la hora y minutos (HH:mm) si viene en formato HH:mm:ss
      const horaFormateada = hora.split(':').slice(0, 2).join(':');

      // Asegurar que la hora tenga el formato correcto (HH:mm)
      if (!/^\d{2}:\d{2}$/.test(horaFormateada)) {
        console.error('Formato de hora inválido:', horaFormateada);
        return false;
      }

      // Crear objeto Date con la fecha y hora combinadas
      const fechaCita = new Date(`${fecha}T${horaFormateada}`);
      const ahora = new Date();

      // Comparar las fechas usando getTime() para una comparación más simple y precisa
      return fechaCita > ahora;
    } catch (error) {
      console.error('Error al procesar la fecha:', error);
      return false;
    }
  }
  
  anularCita(idCita: string): void {
    if (confirm('¿Está seguro que desea anular esta cita?')) {
      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';
      
      this.citaService.anularCita(idCita)
        .pipe(
          catchError(error => {
            console.error('Error al anular cita:', error);
            this.mensajeError = 'Error al anular la cita';
            return of(null);
          }),
          finalize(() => {
            this.cargando = false;
          })
        )
        .subscribe(response => {
          if (response) {
            this.mensajeExito = 'Cita anulada correctamente';
            // Recargar las citas para reflejar el cambio
            this.cargarCitas();
          }
        });
    }
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
}
