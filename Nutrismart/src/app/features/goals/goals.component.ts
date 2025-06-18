import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { FormsModule }                   from '@angular/forms';
import { Subscription }                  from 'rxjs';
import { AuthService }                   from '../../services/auth.service';
import { GoalsService, Goal }            from '../../services/goals.service';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit, OnDestroy {
  tabInterno: 'objetivos' | 'recomendaciones' = 'objetivos';
  objetivos: Goal[] = [];
  recomendaciones = [
    {
      fecha: '2025-03-20',
      resumen: 'Reducir consumo de carbohidratos refinados.',
      comentario: 'Procura evitar panes blancos, pastas refinadas y azúcares. Incluye más vegetales fibrosos y proteína magra.'
    },
    {
      fecha: '2025-03-10',
      resumen: 'Aumentar consumo de agua.',
      comentario: 'Toma al menos 2.5L diarios, distribuidos durante el día.'
    }
  ];
  selectedRecomendacion: any = null;
  verDetalles = false;
  showPopup = false;
  mensajeService = '';
  mesesOptions = [1, 2, 3, 4, 5, 6];
  nuevoObjetivo: { tipo: string; meta: string; meses: number | null } = {
    tipo: '',
    meta: '',
    meses: null
  };

  progresoTemp: Record<string, number> = {};

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

  private loadGoals(): void {
    this.subs.add(
      this.goalsSvc.getGoals(this.uid)
        .subscribe(list => {
          this.objetivos = list;
          
          this.objetivos.forEach(g => {
            if (g.id) {
              this.progresoTemp[g.id] = g.progreso;
            }
          });
        })
    );
  }

  private addMonths(date: Date, months: number): Date {
    const y0 = date.getFullYear();
    const m0 = date.getMonth();
    const d0 = date.getDate();
    const total = m0 + months;
    const y1 = y0 + Math.floor(total / 12);
    const m1 = total % 12;
    const lastDay = new Date(y1, m1 + 1, 0).getDate();
    const d1 = Math.min(d0, lastDay);
    return new Date(y1, m1, d1);
  }

  guardarObjetivo(): void {
    if (!this.nuevoObjetivo.tipo ||
        !this.nuevoObjetivo.meta ||
        this.nuevoObjetivo.meses == null
    ) {
      this.mensajeService = 'Por favor completa todos los campos del objetivo.';
      this.showPopup = true;
      this.autoClosePopup();
      return;
    }

    const m = this.nuevoObjetivo.meses;
    if (isNaN(m) || m < 1 || m > 6) {
      this.mensajeService = 'Selecciona un número válido de meses (1–6).';
      this.showPopup = true;
      this.autoClosePopup();
      return;
    }

    const futura = this.addMonths(new Date(), m);
    const isoDate = futura.toISOString().split('T')[0];
    const toSave: Omit<Goal, 'id' | 'createdAt'> = {
      tipo: this.nuevoObjetivo.tipo,
      meta: this.nuevoObjetivo.meta,
      fecha: isoDate,
      progreso: 0
    };

    this.goalsSvc.addGoal(this.uid, toSave)
      .then(() => {
        this.nuevoObjetivo = { tipo: '', meta: '', meses: null };
        this.mensajeService = 'Objetivo guardado ✔️';
        this.showPopup = true;
        this.autoClosePopup();
        this.tabInterno = 'objetivos';
        this.loadGoals();
      })
      .catch(err => console.error(err));
  }

  closePopup(): void {
    this.showPopup = false;
  }

  private autoClosePopup(): void {
    setTimeout(() => this.closePopup(), 5000);
  }

  actualizarProgreso(goal: Goal): void {
    const raw = this.progresoTemp[goal.id!] ?? goal.progreso;
    const prog = Math.max(0, Math.min(100, raw));  
    this.goalsSvc.updateGoal(this.uid, goal.id!, { progreso: prog })
      .then(() => this.loadGoals())
      .catch(err => console.error(err));
  }

 
  eliminarObjetivo(goal: Goal): void {
    this.goalsSvc.deleteGoal(this.uid, goal.id!)
      .then(() => this.loadGoals())
      .catch(err => console.error(err));
  }

  abrirModal(rec: any): void {
    this.selectedRecomendacion = rec;
  }

  cerrarModal(): void {
    this.selectedRecomendacion = null;
  }


  exportarPDF(): void {
    const el = document.getElementById('pdf-content');
    if (!el) return;

    html2pdf()
      .set({
        margin: 0.5,
        filename: 'plan-nutricional.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      })
      .from(el)
      .save()
      .then(() => this.verDetalles = false)
      .catch((err: any) => console.error(err));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
