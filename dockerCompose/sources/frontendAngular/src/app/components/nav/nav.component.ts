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
  userName: string = 'Pedro Benitez Sanchez';

  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 100);
  }
}