import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BuscarPacienteComponent } from './components/buscar-paciente/buscar-paciente.component';
import { DetallePacienteComponent } from './components/detalle-paciente/detalle-paciente.component';
import { RegistrarPacienteComponent } from './components/registrar-paciente/registrar-paciente.component';
import { inject } from '@angular/core';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'buscar-paciente',
    component: BuscarPacienteComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'detalle-paciente/:id',
    component: DetallePacienteComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'registrar-paciente',
    component: RegistrarPacienteComponent,
    canActivate: [AuthGuard]
  },
  { path: 'logout', redirectTo: 'login', pathMatch: 'full' }
];
