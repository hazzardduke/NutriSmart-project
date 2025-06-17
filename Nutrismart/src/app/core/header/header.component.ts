import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isUserMenuOpen = false;
  photoURL: string | null = null;
  private uid!: string;
  private subs = new Subscription();

  constructor(
    private auth: AuthService,
    private router: Router,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.profileService.getProfileObservable().subscribe(profile => {
        this.photoURL = profile?.fotoURL || 'assets/images/logo.jpeg';
      })
    );
  
    this.subs.add(
      this.auth.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.profileService.getProfile(this.uid).subscribe(); // activa la emisión inicial
        }
      })
    );
  }
  

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
