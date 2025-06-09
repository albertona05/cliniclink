import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerHistorialPaciente(idPaciente: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/historial/${idPaciente}`);
  }
}