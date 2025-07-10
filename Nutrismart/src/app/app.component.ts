import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { RouterModule }                  from '@angular/router';
import { Subscription }                  from 'rxjs';
import { AuthService }                   from './services/auth.service';
import { SidebarComponent }              from './core/sidebar/sidebar.component';
import { HeaderComponent }               from './core/header/header.component';
import { VerifyEmailRequestComponent }   from './verify-email-request/verify-email-request.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    VerifyEmailRequestComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isVerified      = false;
  private sub     = new Subscription();

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.sub.add(
      this.auth.isAuthenticated$.subscribe(v => this.isAuthenticated = v)
    );
    this.sub.add(
      this.auth.user$.subscribe(u => this.isVerified = !!u && u.emailVerified)
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
