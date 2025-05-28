import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  chatbotVisible = false;

  constructor(public auth: AuthService) {}

  // logout() {
  //   this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  // }

  toggleChatbot() {
    this.chatbotVisible = !this.chatbotVisible;
  }
}
