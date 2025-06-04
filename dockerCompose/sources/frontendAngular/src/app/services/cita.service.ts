import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    console.log('=== INICIO: CitaService.crearCita ===');
    console.log('Datos recibidos:', JSON.stringify(citaData));
    console.log('Tipos de datos recibidos:', {
      fecha: typeof citaData.fecha,
      hora: typeof citaData.hora,
      medicoId: typeof citaData.medicoId,
      pacienteId: typeof citaData.pacienteId
    });
    
    // Validación de datos antes de formatear
    if (!citaData.fecha || !citaData.hora || !citaData.medicoId || !citaData.pacienteId) {
      console.error('Error de validación: Campos requeridos faltantes', {
        fecha: !!citaData.fecha,
        hora: !!citaData.hora,
        medicoId: !!citaData.medicoId,
        pacienteId: !!citaData.pacienteId
      });
      throw new Error('Todos los campos son requeridos para crear una cita');
    }
    
    // Convertir el ID del médico a número si es posible
    const medicoId = isNaN(Number(citaData.medicoId)) ? citaData.medicoId : Number(citaData.medicoId);
    console.log('ID del médico convertido:', medicoId, 'Tipo:', typeof medicoId);
    
    // Asegurar que todos los campos estén presentes y con el formato correcto
    const datosFormateados = {
      fecha: citaData.fecha.toString(), 
      hora: citaData.hora.toString(),
      id_medico: medicoId, 
      dni_paciente: citaData.pacienteId.toString().trim()
    };
    
    // Verificación detallada antes de enviar
    console.log('Datos formateados a enviar:', JSON.stringify(datosFormateados));
    console.log('Tipos de datos formateados:', {
      fecha: typeof datosFormateados.fecha,
      hora: typeof datosFormateados.hora,
      id_medico: typeof datosFormateados.id_medico,
      dni_paciente: typeof datosFormateados.dni_paciente
    });
    
    // Verificación final de que todos los campos requeridos estén presentes
    if (!datosFormateados.fecha || !datosFormateados.hora || 
        !datosFormateados.id_medico || !datosFormateados.dni_paciente) {
      console.error('Error de validación final: Campos formateados faltantes', {
        fecha: !!datosFormateados.fecha,
        hora: !!datosFormateados.hora,
        id_medico: !!datosFormateados.id_medico,
        dni_paciente: !!datosFormateados.dni_paciente
      });
      throw new Error('Todos los campos son requeridos para crear una cita');
    }
    
    console.log(`Enviando solicitud POST a ${this.apiUrl}/citas`);
    const resultado = this.http.post(`${this.apiUrl}/citas`, datosFormateados);
    
    // Agregar log para la respuesta usando pipe
    return resultado.pipe(
      catchError(error => {
        console.error('Error en la respuesta del servidor:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          mensaje: error.error?.mensaje,
          error: error.error
        });
        throw error; 
      })
    );
  }
}