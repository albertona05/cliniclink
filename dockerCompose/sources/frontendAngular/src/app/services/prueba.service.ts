import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PruebaResponse {
  success: boolean;
  data: Prueba[];
  mensaje?: string;
}

export interface Prueba {
  id: number;
  paciente_id: number;
  paciente: string;
  tipo_prueba: string;
  medico_asignado: string;
  fecha: string;
  fecha_creacion: string;
  estado: string;
  resultado?: string;
  archivos?: Array<{
    nombre: string;
    tipo: string;
    url: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PruebaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('PruebaService inicializado con URL:', this.apiUrl);
  }

  // Obtener pruebas solicitadas
  obtenerPruebasSolicitadas(): Observable<PruebaResponse> {
    console.log('Solicitando pruebas al endpoint:', `${this.apiUrl}/pruebas/solicitadas`);
    return this.http.get<PruebaResponse>(`${this.apiUrl}/pruebas/solicitadas`)
      .pipe(
        tap(response => {
          console.log('Respuesta de pruebas solicitadas recibida:', {
            success: response.success,
            cantidad: response.data?.length || 0,
            mensaje: response.mensaje
          });
        }),
        catchError(error => {
          console.error('Error al obtener pruebas solicitadas:', error);
          console.error('Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          return throwError(() => error);
        })
      );
  }

  // Crear una nueva prueba médica (ahora se crea como una cita con es_prueba=true)
  crearPrueba(datosPrueba: any): Observable<any> {
    console.log('Creando nueva prueba con datos:', datosPrueba);
    return this.http.post(`${this.apiUrl}/pruebas`, datosPrueba)
      .pipe(
        tap(response => {
          console.log('Respuesta de creación de prueba recibida:', response);
        }),
        catchError(error => {
          console.error('Error al crear prueba:', error);
          console.error('Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          return throwError(() => error);
        })
      );
  }

  // Finalizar una prueba y registrar su resultado
  finalizarPrueba(datosPrueba: any): Observable<any> {
    console.log('Finalizando prueba con datos:', datosPrueba);
    console.log('Enviando petición a:', `${this.apiUrl}/pruebas/finalizar`);
    return this.http.post(`${this.apiUrl}/pruebas/finalizar`, datosPrueba)
      .pipe(
        tap(response => {
          console.log('Respuesta de finalización de prueba recibida:', response);
        }),
        catchError(error => {
          console.error('Error al finalizar prueba:', error);
          console.error('Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          return throwError(() => error);
        })
      );
  }
}