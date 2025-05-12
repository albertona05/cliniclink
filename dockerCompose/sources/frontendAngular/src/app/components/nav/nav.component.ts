import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {
  userName: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.updateUserName();
  }

  private updateUserName() {
    this.userName = this.authService.getUserName();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => console.log('Logout exitoso'),
      error: (error) => console.error('Error en logout:', error)
    });
    return false;
  }
}