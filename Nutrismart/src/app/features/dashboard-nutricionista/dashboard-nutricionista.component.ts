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
  clientesTotales: ClientSummary[] = [];
  clientesPaginados: ClientSummary[] = [];
  paginaActual = 1;
  pacientesPorPagina = 4;
  totalPaginas = 1;
  paginas: number[] = [];

  constructor(private svc: DashboardNutricionistaService) {}

  ngOnInit(): void {
    this.todayAppointments$ = this.svc.getTodaysWithClient();
    this.svc.getActiveClients().subscribe(list => {
      this.clientesTotales = list;
      this.totalPaginas = Math.ceil(this.clientesTotales.length / this.pacientesPorPagina);
      this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
      this.actualizarPaginacion();
    });
  }

  translateStatus(s: string): string {
    switch (s) {
      case 'confirmed': return 'Confirmada';
      case 'canceled':  return 'Cancelada';
      case 'completed': return 'Completada';
      default:          return s;
    }
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.pacientesPorPagina;
    const fin = inicio + this.pacientesPorPagina;
    this.clientesPaginados = this.clientesTotales.slice(inicio, fin);
  }

  irAPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  siguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  anterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }
}
