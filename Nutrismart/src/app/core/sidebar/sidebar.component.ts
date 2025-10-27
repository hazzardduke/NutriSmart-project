import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService, UserProfileData } from '../../services/profile.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  profile: UserProfileData | null = null;

  constructor(private ps: ProfileService) {}

  ngOnInit() {
    this.ps.getProfileObservable().subscribe(p => this.profile = p);
  }
}
