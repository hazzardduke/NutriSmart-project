import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import {
  GoalsNutricionistService,
  Goal,
  Recommendation,
  UserSummary
} from '../../services/goals-nutricionist.service';

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
  selectedClientName = '';

  objetivos: Goal[] = [];
  historico: Goal[] = [];
  recomendaciones: Recommendation[] = [];
  progresoTemp: Record<string, number> = {};

  tabPrincipal: 'crear' | 'objetivos' | 'historico' = 'crear';
  subTab: 'objetivos' | 'recomendaciones' = 'objetivos';

  mesesOptions = [1, 2, 3, 4, 5, 6];
  nuevoObjetivo = { tipo: '', meta: '', meses: null as number | null };

  showRecModal = false;
  recModalGoal!: Goal;
  newComentario = '';

  searchTerm = '';
  filteredClients: UserSummary[] = [];
  showAllHist = false;

  private subs = new Subscription();

  constructor(private svc: GoalsNutricionistService) {}

  ngOnInit(): void {
    this.subs.add(this.svc.listClients().subscribe(list => (this.clients = list)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  switchPrincipal(tab: 'crear' | 'objetivos' | 'historico'): void {
    this.tabPrincipal = tab;
    this.selectedClientUid = null;
    this.selectedClientName = '';
    this.objetivos = [];
    this.historico = [];
    this.recomendaciones = [];
    this.nuevoObjetivo = { tipo: '', meta: '', meses: null };
    this.subTab = 'objetivos';
    this.searchTerm = '';
    this.filteredClients = [];
    this.showAllHist = false;
  }

  onSearchFocus(): void {
    this.filteredClients = [...this.clients];
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredClients = [...this.clients];
      return;
    }
    this.filteredClients = this.clients.filter(c =>
      `${c.nombre} ${c.apellidos} ${c.cedula}`.toLowerCase().includes(term)
    );
  }

  selectClient(uid: string): void {
    const selected = this.clients.find(c => c.uid === uid);
    this.selectedClientUid = uid;
    this.selectedClientName = selected ? `${selected.nombre} ${selected.apellidos}` : '';
    this.searchTerm = this.selectedClientName;
    this.filteredClients = [];
    this.showAllHist = false;
    this.onClientSelect();
  }

  showAllHistorico(): void {
    this.selectedClientUid = null;
    this.selectedClientName = 'Todos los clientes';
    this.showAllHist = true;
    this.searchTerm = this.selectedClientName;
    this.filteredClients = [];
    this.loadAllHistoric();
  }

  onClientSelect(): void {
    if (!this.selectedClientUid) {
      this.objetivos = [];
      this.historico = [];
      this.recomendaciones = [];
      return;
    }

    this.subs.add(
      this.svc.getGoals(this.selectedClientUid).subscribe(all => {
        this.objetivos = all.filter(o => o.estado === 'en progreso');
        this.historico = all.filter(o => o.estado === 'completado');

        this.progresoTemp = {};
        this.objetivos.forEach(o => {
          if (o.id) this.progresoTemp[o.id] = o.progreso;
        });

        if (this.subTab === 'recomendaciones') {
          this.loadRecs();
        }
      })
    );
  }

  private loadAllHistoric(): void {
    this.historico = [];
    this.clients.forEach(c => {
      this.subs.add(
        this.svc.getGoals(c.uid).subscribe(all => {
          const completos = all.filter(o => o.estado === 'completado');
          this.historico.push(...completos);
          this.historico.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        })
      );
    });
  }

  guardarObjetivo(): void {
    if (!this.selectedClientUid) {
      return this.toast('Selecciona un cliente.', 'warning');
    }
    if (!this.nuevoObjetivo.tipo || !this.nuevoObjetivo.meta || this.nuevoObjetivo.meses == null) {
      return this.toast('Completa todos los campos del objetivo.', 'warning');
    }

    const fechaMeta = this.addMonths(new Date(), this.nuevoObjetivo.meses)
      .toISOString()
      .split('T')[0];

    this.svc
      .addGoal(this.selectedClientUid, {
        tipo: this.nuevoObjetivo.tipo,
        meta: this.nuevoObjetivo.meta,
        fecha: fechaMeta
      })
      .then(() => {
        this.modal('¡Objetivo creado!', 'El objetivo se creó y quedó en progreso.', 'success');
        this.switchPrincipal('objetivos');
        this.onClientSelect();
      })
      .catch(() => this.modal('Error', 'No se pudo crear el objetivo.', 'error'));
  }

  updateProgreso(o: Goal): void {
    if (!this.selectedClientUid) return;

    const id = o.id!;
    const valor = Math.max(0, Math.min(100, this.progresoTemp[id] ?? o.progreso));

    this.svc
      .updateGoal(this.selectedClientUid, id, { progreso: valor })
      .then(() => this.toast('Progreso actualizado', 'success'))
      .catch(() => this.toast('No se pudo actualizar el progreso', 'error'));
  }

  confirmarCompletar(o: Goal): void {
    Swal.fire({
      title: '¿Deseas completar este objetivo?',
      text: 'El progreso está al 100% y se moverá al histórico.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, completarlo',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.completarObjetivo(o);
      }
    });
  }

  completarObjetivo(o: Goal): void {
    if (!this.selectedClientUid) return;

    const hoy = new Date().toISOString().split('T')[0];
    this.svc
      .updateGoal(this.selectedClientUid!, o.id!, {
        progreso: 100,
        estado: 'completado',
        fecha: hoy
      })
      .then(() => {
        Swal.fire({
          title: '¡Objetivo completado!',
          text: 'El objetivo se movió al histórico con éxito.',
          icon: 'success',
          confirmButtonColor: '#28a745'
        });
        this.onClientSelect();
      })
      .catch(() =>
        this.modal('Error', 'No se pudo completar el objetivo.', 'error')
      );
  }

  switchSub(tab: 'objetivos' | 'recomendaciones'): void {
    this.subTab = tab;
    if (tab === 'recomendaciones' && this.selectedClientUid) {
      this.loadRecs();
    }
  }

  openRecomendacion(goal: Goal): void {
    this.recModalGoal = goal;
    this.newComentario = '';
    this.showRecModal = true;
  }

  saveRecomendacion(): void {
    if (!this.selectedClientUid) return;
    if (!this.newComentario.trim()) {
      return this.toast('Escribe tu recomendación.', 'warning');
    }

    this.svc
      .addRecommendation(this.selectedClientUid, this.recModalGoal.id!, {
        comentario: this.newComentario.trim(),
        tipo: this.recModalGoal.tipo,
        meta: this.recModalGoal.meta
      })
      .then(() => {
        this.modal('¡Recomendación guardada!', 'Se agregó correctamente.', 'success');
        this.showRecModal = false;
        this.loadRecs();
      })
      .catch(() => this.modal('Error', 'No se pudo guardar la recomendación.', 'error'));
  }

  private loadRecs(): void {
    if (!this.selectedClientUid) return;
    this.recomendaciones = [];
    this.objetivos.forEach(goal => {
      this.subs.add(
        this.svc.listRecommendations(this.selectedClientUid!, goal.id!).subscribe(arr => {
          this.recomendaciones.push(...arr);
          this.recomendaciones.sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
        })
      );
    });
  }

  private addMonths(d: Date, m: number): Date {
    const y0 = d.getFullYear(),
      m0 = d.getMonth(),
      d0 = d.getDate();
    const total = m0 + m,
      y1 = y0 + Math.floor(total / 12),
      m1 = total % 12;
    const last = new Date(y1, m1 + 1, 0).getDate(),
      d1 = Math.min(d0, last);
    return new Date(y1, m1, d1);
  }

  private modal(
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning' | 'info' | 'question'
  ): void {
    Swal.fire({ icon, title, text, confirmButtonColor: '#a1c037' });
  }

  private toast(
    title: string,
    icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info'
  ): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true
    });
    Toast.fire({ icon, title });
  }
}
