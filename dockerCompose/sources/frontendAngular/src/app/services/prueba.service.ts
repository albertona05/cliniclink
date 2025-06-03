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

  // Crear una nueva prueba médica (ahora se crea como una cita con es_prueba=true)
  crearPrueba(datosPrueba: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pruebas`, datosPrueba);
  }

  // Finalizar una prueba y registrar su resultado
  finalizarPrueba(datosPrueba: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pruebas/finalizar`, datosPrueba);
  }
}