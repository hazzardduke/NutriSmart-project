import { Component, OnInit } from '@angular/core';
import {
  CommonModule,
  NgIf,
  NgForOf,
  AsyncPipe,
  DatePipe
} from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DashboardClientService,
  UserProfile,
  Appointment,
  Recommendation,
  Goal
} from '../../services/dashboard-client.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    AsyncPipe,
    DatePipe,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  profile$!: Observable<UserProfile | null>;
  appointments$!: Observable<Appointment[]>;
  recs$!: Observable<Recommendation[]>;
  goals$!: Observable<Goal[]>;

  constructor(private svc: DashboardClientService) {}

  ngOnInit(): void {
    this.profile$ = this.svc.getUserProfile();
    this.appointments$ = this.svc.getUpcomingAppointments();
    this.recs$ = this.svc.getRecentRecommendations();
    this.goals$ = this.svc.getGoals();
  }

  translateStatus(s: 'confirmed' | 'canceled'): string {
    return s === 'confirmed' ? 'Confirmada' : 'Cancelada';
  }
}
