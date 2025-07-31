import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { FormsModule }                   from '@angular/forms';
import { Subscription }                  from 'rxjs';
import Swal                              from 'sweetalert2';
import { AuthService }                   from '../../services/auth.service';
import {
  GoalsService,
  Goal,
  Recommendation
} from '../../services/goals.service';

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
  progresoTemp: Record<string, number> = {};
  showPopup = false;
  mensajeService = '';

  // Recomendaciones
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
      this.goalsSvc.getGoals(this.uid)
        .subscribe(list => {
          this.objetivos = list;
          this.objetivos.forEach(g => {
            if (g.id) this.progresoTemp[g.id] = g.progreso;
          });
        })
    );
  }

  get objetivosEnProgreso(): Goal[] {
    return this.objetivos.filter(g => g.estado === 'en progreso');
  }

  get objetivosCompletados(): Goal[] {
    return this.objetivos.filter(g => g.estado === 'completado');
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
      .catch(err => {
        console.error(err);
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
