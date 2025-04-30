import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { BuscarPacienteComponent } from './components/buscar-paciente/buscar-paciente.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'buscar-paciente', component: BuscarPacienteComponent, canActivate: [AuthGuard] }
];
