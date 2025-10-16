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
  imports: [CommonModule, NgIf, NgForOf, AsyncPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  profile$!: Observable<UserProfile | null>;
  appointments$!: Observable<Appointment[]>;
  goals$!: Observable<Goal[]>;
  recs$!: Observable<Recommendation[]>;


  paginatedGoals: Goal[] = [];
  currentGoalPage = 1;
  goalsPerPage = 4;
  totalGoalPages = 0;
  goalPagesToShow: (number | string)[] = [];


  paginatedRecs: Recommendation[] = [];
  currentRecPage = 1;
  recsPerPage = 4;
  totalRecPages = 0;
  recPagesToShow: (number | string)[] = [];

  constructor(private svc: DashboardClientService) {}

  ngOnInit(): void {
    this.profile$ = this.svc.getUserProfile();
    this.appointments$ = this.svc.getUpcomingAppointments();
    this.goals$ = this.svc.getGoals();
    this.recs$ = this.svc.getRecentRecommendations();

    this.goals$.subscribe((goals) => {
      this.totalGoalPages = Math.ceil(goals.length / this.goalsPerPage);
      this.updateGoalsPagination();
    });

    this.recs$.subscribe((recs) => {
      this.totalRecPages = Math.ceil(recs.length / this.recsPerPage);
      this.updateRecsPagination();
    });
  }


  updateGoalsPagination(): void {
    this.goals$.subscribe((goals) => {
      const start = (this.currentGoalPage - 1) * this.goalsPerPage;
      const end = start + this.goalsPerPage;
      this.paginatedGoals = goals.slice(start, end);
      this.goalPagesToShow = this.generatePageRange(this.currentGoalPage, this.totalGoalPages);
    });
  }

  goToGoalPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalGoalPages) {
      this.currentGoalPage = page;
      this.updateGoalsPagination();
    }
  }

  prevGoalPage(): void {
    if (this.currentGoalPage > 1) {
      this.currentGoalPage--;
      this.updateGoalsPagination();
    }
  }

  nextGoalPage(): void {
    if (this.currentGoalPage < this.totalGoalPages) {
      this.currentGoalPage++;
      this.updateGoalsPagination();
    }
  }


  updateRecsPagination(): void {
    this.recs$.subscribe((recs) => {
      const start = (this.currentRecPage - 1) * this.recsPerPage;
      const end = start + this.recsPerPage;
      this.paginatedRecs = recs.slice(start, end);
      this.recPagesToShow = this.generatePageRange(this.currentRecPage, this.totalRecPages);
    });
  }

  goToRecPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalRecPages) {
      this.currentRecPage = page;
      this.updateRecsPagination();
    }
  }

  prevRecPage(): void {
    if (this.currentRecPage > 1) {
      this.currentRecPage--;
      this.updateRecsPagination();
    }
  }

  nextRecPage(): void {
    if (this.currentRecPage < this.totalRecPages) {
      this.currentRecPage++;
      this.updateRecsPagination();
    }
  }


  private generatePageRange(current: number, total: number): (number | string)[] {
    const delta = 2;
    const range: (number | string)[] = [];

    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }

    const first = range[0];
    const last = range[range.length - 1];

    if (typeof first === 'number' && first > 2) range.unshift('...');
    if (typeof first === 'number' && first !== 1) range.unshift(1);
    if (typeof last === 'number' && last < total - 1) range.push('...');
    if (typeof last === 'number' && last !== total) range.push(total);

    return range;
  }

  translateStatus(s: 'confirmed' | 'canceled'): string {
    return s === 'confirmed' ? 'Confirmada' : 'Cancelada';
  }
}
