import { Component, OnInit, OnDestroy, HostListener, ElementRef, Output, EventEmitter } from '@angular/core';
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
  @Output() menuToggle = new EventEmitter<void>();
  isUserMenuOpen = false;
  photoURL: string | null = null;
  userName = '';
  userRole = '';
  private subs = new Subscription();

  constructor(
    private auth: AuthService,
    private router: Router,
    private profileService: ProfileService,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.profileService.getProfileObservable().subscribe((p: UserProfileData | null) => {
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

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.isUserMenuOpen && !this.eRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen = false;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
