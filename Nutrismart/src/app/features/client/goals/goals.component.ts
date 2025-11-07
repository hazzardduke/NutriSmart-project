import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';
import {
  GoalsService,
  Goal,
  Recommendation
} from '../../../services/goals.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [GoalsService],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit, OnDestroy {
  tab: 'definir' | 'en-progreso' | 'historico' = 'definir';
  objetivos: Goal[] = [];
  mesesOptions = [1, 2, 3, 4, 5, 6];
  nuevoObjetivo = { tipo: '', meta: '', meses: null as number | null };
  showPopup = false;
  mensajeService = '';


  itemsPerPage = 5;

  currentPageProgreso = 1;
  totalPagesProgreso = 1;
  objetivosProgresoPaginados: Goal[] = [];
  pagesProgreso: (number | string)[] = [];


  currentPageHistorico = 1;
  totalPagesHistorico = 1;
  objetivosHistoricoPaginados: Goal[] = [];
  pagesHistorico: (number | string)[] = [];


  selectedRecs: Recommendation[] = [];
  showRecModal = false;
  currentGoalTipo = '';
  currentGoalMeta = '';

  private uid = '';
  private subs = new Subscription();

  constructor(
    private auth: AuthService,
    private goalsSvc: GoalsService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.auth.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.loadGoals();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadGoals(): void {
    this.subs.add(
      this.goalsSvc.getGoals(this.uid).subscribe(list => {
        this.objetivos = list;
        this.updatePaginationProgreso();
        this.updatePaginationHistorico();
      })
    );
  }


  get objetivosEnProgreso(): Goal[] {
    return this.objetivos.filter(g => g.estado === 'en progreso');
  }

  private updatePaginationProgreso(): void {
    const data = this.objetivosEnProgreso;
    this.totalPagesProgreso = Math.ceil(data.length / this.itemsPerPage);
    const start = (this.currentPageProgreso - 1) * this.itemsPerPage;
    this.objetivosProgresoPaginados = data.slice(start, start + this.itemsPerPage);
    this.pagesProgreso = this.buildPages(this.currentPageProgreso, this.totalPagesProgreso);
  }

  nextProgreso(): void {
    if (this.currentPageProgreso < this.totalPagesProgreso) {
      this.currentPageProgreso++;
      this.updatePaginationProgreso();
    }
  }

  prevProgreso(): void {
    if (this.currentPageProgreso > 1) {
      this.currentPageProgreso--;
      this.updatePaginationProgreso();
    }
  }

  goToPageProgreso(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPagesProgreso) {
      this.currentPageProgreso = page;
      this.updatePaginationProgreso();
    }
  }


  get objetivosCompletados(): Goal[] {
    return this.objetivos.filter(g => g.estado === 'completado');
  }

  private updatePaginationHistorico(): void {
    const data = this.objetivosCompletados;
    this.totalPagesHistorico = Math.ceil(data.length / this.itemsPerPage);
    const start = (this.currentPageHistorico - 1) * this.itemsPerPage;
    this.objetivosHistoricoPaginados = data.slice(start, start + this.itemsPerPage);
    this.pagesHistorico = this.buildPages(this.currentPageHistorico, this.totalPagesHistorico);
  }

  nextHistorico(): void {
    if (this.currentPageHistorico < this.totalPagesHistorico) {
      this.currentPageHistorico++;
      this.updatePaginationHistorico();
    }
  }

  prevHistorico(): void {
    if (this.currentPageHistorico > 1) {
      this.currentPageHistorico--;
      this.updatePaginationHistorico();
    }
  }

  goToPageHistorico(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPagesHistorico) {
      this.currentPageHistorico = page;
      this.updatePaginationHistorico();
    }
  }


  private buildPages(current: number, total: number): (number | string)[] {
    const visible = 7;
    const range: (number | string)[] = [];
    if (total <= visible) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      const left = Math.max(2, current - 2);
      const right = Math.min(total - 1, current + 2);
      range.push(1);
      if (left > 2) range.push('...');
      for (let i = left; i <= right; i++) range.push(i);
      if (right < total - 1) range.push('...');
      range.push(total);
    }
    return range;
  }


  guardarObjetivo(): void {
    if (!this.nuevoObjetivo.tipo || !this.nuevoObjetivo.meta || this.nuevoObjetivo.meses == null) {
      return this.alert('Por favor completa todos los campos.');
    }
    const m = this.nuevoObjetivo.meses;
    if (isNaN(m) || m < 1 || m > 6) {
      return this.alert('Selecciona un número válido de meses.');
    }

    const futura = this.addMonths(new Date(), m);
    const isoDate = futura.toISOString().split('T')[0];
    const toSave: Omit<Goal, 'id' | 'createdAt'> = {
      tipo: this.nuevoObjetivo.tipo,
      meta: this.nuevoObjetivo.meta,
      fecha: isoDate,
      progreso: 0,
      estado: 'en progreso'
    };

    this.goalsSvc.addGoal(this.uid, toSave)
      .then(() => {
        this.nuevoObjetivo = { tipo: '', meta: '', meses: null };
        Swal.fire({
          icon: 'success',
          title: '¡Objetivo creado!',
          text: 'Tu objetivo ha sido guardado correctamente.',
          confirmButtonText: 'Ver en Progreso',
          background: '#fafafa',
          confirmButtonColor: '#a1c037'
        }).then(() => {
          this.tab = 'en-progreso';
          this.loadGoals();
        });
      })
      .catch(() => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear el objetivo.',
          background: '#fafafa',
          confirmButtonColor: '#dc3545'
        });
      });
  }


  abrirRecs(goal: Goal): void {
    this.currentGoalTipo = goal.tipo;
    this.currentGoalMeta = goal.meta;
    this.subs.add(
      this.goalsSvc.getRecommendations(this.uid, goal.id!)
        .subscribe(recs => {
          this.selectedRecs = recs;
          this.showRecModal = true;
        })
    );
  }

  cerrarRecs(): void {
    this.showRecModal = false;
    this.selectedRecs = [];
  }

  closePopup(): void {
    this.showPopup = false;
  }

  private alert(msg: string): void {
    this.mensajeService = msg;
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 4000);
  }

  private addMonths(date: Date, months: number): Date {
    const y0 = date.getFullYear(), m0 = date.getMonth(), d0 = date.getDate();
    const total = m0 + months;
    const y1 = y0 + Math.floor(total / 12), m1 = total % 12;
    const lastDay = new Date(y1, m1 + 1, 0).getDate();
    const d1 = Math.min(d0, lastDay);
    return new Date(y1, m1, d1);
  }
}
