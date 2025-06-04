import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  obtenerMedicos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/medicos`);
  }

  obtenerHorasLibres(idMedico: string, fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/medicos/horas-libres?id_medico=${idMedico}&fecha=${fecha}`);
  }

  obtenerMedicamentos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/medicamentos`);
  }

  buscarMedicamentos(termino: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/medicamentos?termino=${termino}`);
  }

  crearMedicamento(medicamento: {nombre: string, descripcion?: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/medicamentos`, medicamento);
  }

  finalizarCita(datosCita: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/medicos/finalizar-cita`, datosCita);
  }

  obtenerCitasPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/citas/pendientes`);
  }

  obtenerCitasFinalizadas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/citas/finalizadas`);
  }

  obtenerCitasPorFecha(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/citas/fecha/${fecha}`);
  }

  crearCita(datosCita: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/citas`, datosCita);
  }

  obtenerCita(idCita: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/citas/${idCita}`);
  }

  obtenerCitasDia(idMedico: string, fecha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/medicos/citas-dia`, { fecha });
  }

  registrarMedico(medico: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/medicos/registro`, medico);
  }
}