import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { BotonVolverComponent } from '../boton-volver/boton-volver.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

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
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Debug: Mostrar información del usuario autenticado
    const userToken = this.authService.getToken();
    if (userToken) {
      try {
        const tokenParts = userToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('=== DEBUG FACTURAS ===');
          console.log('ID del usuario autenticado:', payload.id);
          console.log('Rol del usuario:', payload.rol);
          console.log('Nombre del usuario:', payload.nombre);
        }
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    } else {
      console.log('No hay token de autenticación');
    }

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idPaciente = params['id'];
        console.log('ID del paciente solicitado en la URL:', this.idPaciente);
        console.log('¿Coinciden los IDs?', userToken ? 'Revisar arriba' : 'No hay token');
        this.cargarFacturas(this.idPaciente);
      }
    });
  }
  
  cargarFacturas(id: string) {
    this.cargando = true;
    this.mensajeError = '';
    
    this.http.get<any>(`${this.apiUrl}/facturas/${id}`)
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
    console.log(`Descargando factura ${idFactura}`);
    
    // Crear una URL para la descarga
    const url = `${this.apiUrl}/facturas/descargar/${idFactura}`;
    
    // Usar HttpClient para obtener el archivo como blob
    this.http.get(url, { responseType: 'blob' })
      .pipe(
        catchError(error => {
          console.error('Error al descargar la factura:', error);
          alert(`Error al descargar la factura: ${error.message || 'Error desconocido'}`);
          throw error;
        })
      )
      .subscribe(blob => {
        // Crear un objeto URL para el blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Crear un elemento <a> temporal
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `factura_${idFactura}.pdf`;
        
        // Añadir el enlace al documento
        document.body.appendChild(link);
        
        // Simular un clic en el enlace
        link.click();
        
        // Eliminar el enlace del documento
        document.body.removeChild(link);
        
        // Liberar el objeto URL
        window.URL.revokeObjectURL(blobUrl);
      });
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