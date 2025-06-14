import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  registrarPaciente(pacienteData: any): Observable<any> {
    return this.http.post(this.apiUrl, pacienteData);
  }

  obtenerPaciente(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  actualizarPaciente(id: string, pacienteData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, pacienteData);
  }

  eliminarPaciente(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  listarPacientes(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}