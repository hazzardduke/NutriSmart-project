// src/app/core/header/header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  isUserMenuOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
  this.auth.logout()
    .then(() => {
      this.isUserMenuOpen = false;     
      this.router.navigate(['/login']);
    })
    .catch(err => console.error('Error al cerrar sesión', err));
}



}
