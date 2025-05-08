import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  obtenerCitasPaciente(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/citas/${id}`);
  }

  anularCita(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/citas/${id}`, {});
  }

  crearCita(citaData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/citas`, citaData);
  }
}