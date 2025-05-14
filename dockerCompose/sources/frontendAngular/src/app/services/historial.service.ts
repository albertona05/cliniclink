import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  obtenerHistorialPaciente(idPaciente: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial/${idPaciente}`);
  }
}