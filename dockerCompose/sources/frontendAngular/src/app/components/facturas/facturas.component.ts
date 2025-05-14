import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { BotonVolverComponent } from '../boton-volver/boton-volver.component';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [BotonVolverComponent, CommonModule, FormsModule, NavComponent],
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.css']
})
export class FacturasComponent implements OnInit {
  facturas: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';
  idPaciente: string = '';
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idPaciente = params['id'];
        this.cargarFacturas(this.idPaciente);
      }
    });
  }
  
  cargarFacturas(id: string) {
    this.cargando = true;
    this.mensajeError = '';
    
    this.http.get<any>(`http://localhost:3000/facturas/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error al cargar facturas:', error);
          this.mensajeError = 'Error al cargar las facturas del paciente';
          return of(null);
        }),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe(response => {
        if (response) {
          this.facturas = response;
        } else if (!this.mensajeError) {
          this.mensajeError = 'Error al cargar las facturas del paciente';
        }
      });
  }

  descargarFactura(idFactura: number) {
    // Aquí se implementaría la descarga de la factura
    // Por ahora solo mostramos un mensaje en consola
    console.log(`Descargando factura ${idFactura}`);
    alert(`La factura ${idFactura} se está descargando...`);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString();
  }

  volver() {
    this.router.navigate(['/detalle-paciente', this.idPaciente]);
  }
}