import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BuscarPacienteComponent } from './components/buscar-paciente/buscar-paciente.component';
import { DetallePacienteComponent } from './components/detalle-paciente/detalle-paciente.component';
import { RegistrarPacienteComponent } from './components/registrar-paciente/registrar-paciente.component';
import { CitasPacienteComponent } from './components/citas-paciente/citas-paciente.component';
import { FacturasComponent } from './components/facturas/facturas.component';
import { GestionarCitaComponent } from './components/gestionar-cita/gestionar-cita.component';
import { ReservarCitaComponent } from './components/reservar-cita/reservar-cita.component';
import { inject } from '@angular/core';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'buscar-paciente',
    component: BuscarPacienteComponent,
    canActivate: [AuthGuard],
    data: { rolesPermitidos: ['recepcion'] }
  },
  {
    path: 'detalle-paciente/:id',
    component: DetallePacienteComponent,
    canActivate: [AuthGuard],
    data: { rolesPermitidos: ['recepcion'] }
  },
  {
    path: 'registrar-paciente',
    component: RegistrarPacienteComponent,
    canActivate: [AuthGuard],
    data: { rolesPermitidos: ['recepcion'] }
  },
  {
    path: 'citas-paciente/:id',
    component: CitasPacienteComponent,
    canActivate: [AuthGuard],
    data: { rolesPermitidos: ['recepcion'] }
  },
  {
    path: 'facturas/:id',
    component: FacturasComponent,
    canActivate: [AuthGuard],
    data: { rolesPermitidos: ['recepcion'] }
  },
  {
    path: 'gestionar-cita',
    component: GestionarCitaComponent,
    canActivate: [AuthGuard],
    data: { rolesPermitidos: ['recepcion'] }
  },
  {
    path: 'reservar-cita',
    component: ReservarCitaComponent,
    canActivate: [AuthGuard],
    data: { rolesPermitidos: ['paciente'] }
  },
  { path: 'logout', redirectTo: 'login', pathMatch: 'full' }
];
