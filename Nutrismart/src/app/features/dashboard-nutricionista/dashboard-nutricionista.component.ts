import { Component, OnInit } from '@angular/core';
import {
  CommonModule,
  NgIf,
  NgForOf,
  AsyncPipe,
  DatePipe
} from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  DashboardNutricionistaService,
  AppointmentWithClient,
  ClientSummary
} from '../../services/dashboard-nutricionista.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard-nutricionista',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    AsyncPipe,
    DatePipe,
    RouterModule
  ],
  templateUrl: './dashboard-nutricionista.component.html',
  styleUrls: ['./dashboard-nutricionista.component.scss']
})
export class DashboardNutricionistaComponent implements OnInit {
  todayAppointments$!: Observable<AppointmentWithClient[]>;
  activeClients$!: Observable<ClientSummary[]>;

  constructor(private svc: DashboardNutricionistaService) {}

  ngOnInit(): void {
    this.todayAppointments$ = this.svc.getTodaysWithClient();
    this.activeClients$     = this.svc.getActiveClients();
  }

  translateStatus(s: string): string {
    switch (s) {
      case 'confirmed': return 'Confirmada';
      case 'canceled':  return 'Cancelada';
      case 'completed': return 'Completada';
      default:          return s;
    }
  }
}
