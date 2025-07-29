import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GoalsNutricionistService, Goal, UserSummary } from '../../services/goals-nutricionist.service';

@Component({
  selector: 'app-goals-nutricionist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals-nutricionist.component.html',
  styleUrls: ['./goals-nutricionist.component.scss']
})
export class GoalsNutricionistComponent implements OnInit, OnDestroy {
  clients: UserSummary[] = [];
  selectedClientUid: string | null = null;
  mesesOptions = [1, 2, 3, 4, 5, 6];
  nuevoObjetivo: { tipo: string; meta: string; meses: number | null } = { tipo: '', meta: '', meses: null };
  objetivos: Goal[] = [];
  progresoTemp: Record<string, number> = {};
  tabInterno: 'objetivos' | 'recomendaciones' = 'objetivos';
  recomendaciones = [
    { fecha: '2025-03-20', resumen: 'Reducir carbohidratos refinados.', comentario: 'Evita panes blancos y azúcares.' },
    { fecha: '2025-03-10', resumen: 'Aumentar consumo de agua.', comentario: 'Toma al menos 2.5 L diarios.' }
  ];
  selectedRecomendacion: any = null;
  showPopup = false;
  mensajeService = '';
  private subs = new Subscription();

  constructor(private svc: GoalsNutricionistService) {}

  ngOnInit(): void {
    this.subs.add(this.svc.listClients().subscribe(c => this.clients = c));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onClientSelect(): void {
    if (this.selectedClientUid) {
      this.subs.add(
        this.svc.getGoals(this.selectedClientUid).subscribe(g => {
          this.objetivos = g;
          this.progresoTemp = {};
          g.forEach(o => { if (o.id) this.progresoTemp[o.id] = o.progreso; });
        })
      );
    } else {
      this.objetivos = [];
    }
  }

  private addMonths(d: Date, m: number): Date {
    const y0 = d.getFullYear(), m0 = d.getMonth(), d0 = d.getDate();
    const total = m0 + m, y1 = y0 + Math.floor(total/12), m1 = total % 12;
    const last = new Date(y1, m1+1, 0).getDate(), d1 = Math.min(d0, last);
    return new Date(y1, m1, d1);
  }

  guardarObjetivo(): void {
    if (!this.nuevoObjetivo.tipo || !this.nuevoObjetivo.meta || this.nuevoObjetivo.meses == null) {
      this.mensajeService = 'Completa todos los campos.';
      this.showPopup = true; setTimeout(() => this.showPopup = false, 5000);
      return;
    }
    const m = this.nuevoObjetivo.meses;
    const iso = this.addMonths(new Date(), m).toISOString().split('T')[0];
    const toSave = { tipo: this.nuevoObjetivo.tipo, meta: this.nuevoObjetivo.meta, fecha: iso };
    this.svc.addGoal(this.selectedClientUid!, toSave).then(() => {
      this.nuevoObjetivo = { tipo: '', meta: '', meses: null };
      this.mensajeService = 'Objetivo guardado';
      this.showPopup = true; setTimeout(() => this.showPopup = false, 5000);
      this.tabInterno = 'objetivos';
      this.onClientSelect();
    });
  }

  actualizarProgreso(o: Goal): void {
    const p = Math.max(0, Math.min(100, this.progresoTemp[o.id!] ?? o.progreso));
    this.svc.updateGoal(this.selectedClientUid!, o.id!, { progreso: p }).then(() => this.onClientSelect());
  }

  eliminarObjetivo(o: Goal): void {
    this.svc.deleteGoal(this.selectedClientUid!, o.id!).then(() => this.onClientSelect());
  }

  abrirModal(r: any): void {
    this.selectedRecomendacion = r;
  }

  cerrarModal(): void {
    this.selectedRecomendacion = null;
  }
}
