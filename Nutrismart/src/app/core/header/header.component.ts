// src/app/core/header/header.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProfileService, UserProfileData } from '../../services/profile.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isUserMenuOpen = false;
  photoURL: string | null = null;
  userName = '';
  userRole = '';
  private subs = new Subscription();

  constructor(
    private auth: AuthService,
    private router: Router,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.profileService.getProfileObservable().subscribe((p: UserProfileData|null) => {
        this.photoURL = p?.fotoURL || 'assets/images/logo.jpeg';
        this.userName = p?.nombre || '';
        this.userRole = p?.role || '';
      })
    );
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this.auth.logout().then(() => {
      this.isUserMenuOpen = false;
      this.router.navigate(['/login']);
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
