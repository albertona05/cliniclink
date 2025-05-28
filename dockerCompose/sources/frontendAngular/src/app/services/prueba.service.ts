import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  id_cita?: number; // Añadir campo id_cita
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
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Obtener pruebas solicitadas
  obtenerPruebasSolicitadas(): Observable<PruebaResponse> {
    return this.http.get<PruebaResponse>(`${this.apiUrl}/pruebas/solicitadas`);
  }

  // Crear una nueva prueba médica
  crearPrueba(datosPrueba: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pruebas`, datosPrueba);
  }

  // Finalizar una prueba y registrar su resultado
  finalizarPrueba(datosPrueba: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pruebas/finalizar`, datosPrueba);
  }

  // Obtener archivos de una prueba específica
  obtenerArchivosPrueba(pruebaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pruebas/${pruebaId}/files`);
  }
}