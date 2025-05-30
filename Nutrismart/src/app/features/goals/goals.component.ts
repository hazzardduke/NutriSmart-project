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
  mensajeService = '';
  
  // modelo temporal para template-driven form
  nuevoObjetivo = { tipo: '', meta: '', fecha: '' };

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

  private loadGoals() {
    this.subs.add(
      this.goalsSvc.getGoals(this.uid)
        .subscribe(list => this.objetivos = list)
    );
  }

  guardarObjetivo() {
    if (!this.nuevoObjetivo.tipo || !this.nuevoObjetivo.meta || !this.nuevoObjetivo.fecha) {
      this.mensajeService = 'Por favor completa todos los campos del objetivo.';
      return;
    }
    this.goalsSvc.addGoal(this.uid, {
      tipo: this.nuevoObjetivo.tipo,
      meta: this.nuevoObjetivo.meta,
      fecha: this.nuevoObjetivo.fecha,
      progreso: 0
    }).then(() => {
      this.nuevoObjetivo = { tipo: '', meta: '', fecha: '' };
      this.mensajeService = 'Objetivo guardado ✔️';
      this.loadGoals();
      this.tabInterno = 'objetivos';
    }).catch(err => console.error(err));
  }

  actualizarProgreso(goal: Goal, event: any) {
    const prog = +event.target.value;
    this.goalsSvc.updateGoal(this.uid, goal.id!, { progreso: prog })
      .then(() => this.loadGoals());
  }

  eliminarObjetivo(goal: Goal) {
    this.goalsSvc.deleteGoal(this.uid, goal.id!)
      .then(() => this.loadGoals());
  }

  abrirModal(rec: any) {
    this.selectedRecomendacion = rec;
  }
  cerrarModal() {
    this.selectedRecomendacion = null;
  }

  exportarPDF() {
    const element = document.getElementById('pdf-content');
    if (!element) return;
    html2pdf().set({
      margin: 0.5,
      filename: 'plan-nutricional.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    })
    .from(element)
    .save()
    .then(() => this.verDetalles = false)
    .catch((err: any) => console.error('Error exportando PDF:', err));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
