import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}


  obtenerCitasDia(id_medico: string, fecha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/citas-dia`, { id_medico, fecha });
  }

  finalizarCita(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/finalizar-cita`, datos);
  }
}