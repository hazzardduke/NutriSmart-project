import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import {
  GoalsNutricionistService,
  Goal,
  Recommendation,
  UserSummary
} from '../../../services/goals-nutricionist.service';

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
  objetivos: Goal[] = [];
  historico: Goal[] = [];
  recomendaciones: Recommendation[] = [];
  progresoTemp: Record<string, number> = {};

  tabPrincipal: 'crear' | 'objetivos' | 'historico' = 'crear';
  mesesOptions = [1, 2, 3, 4, 5, 6];
  nuevoObjetivo = { tipo: '', meta: '', meses: null as number | null };

  showRecModal = false;
  recModalGoal!: Goal;
  newComentario = '';
  showInputRec = false;

  itemsPerPageObj = 4;
  currentPageObj = 1;
  totalPagesObj = 1;
  paginatedObjetivos: Goal[] = [];

  itemsPerPageHist = 4;
  currentPageHist = 1;
  totalPagesHist = 1;
  paginatedHistorico: Goal[] = [];

  itemsPerPageRecs = 5;
  currentPageRecs = 1;
  totalPagesRecs = 1;
  paginatedRecs: Recommendation[] = [];

  searchTerm = '';
  filteredClients: UserSummary[] = [];
  isLoading = false;

  private subs = new Subscription();

  constructor(
    private svc: GoalsNutricionistService,
    private cd: ChangeDetectorRef,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.subs.add(this.svc.listClients().subscribe(list => (this.clients = list)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.filteredClients = [];
    }
  }

  onSearchFocus(): void {
    this.filteredClients = [...this.clients];
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredClients = this.clients.filter(c =>
      `${c.nombre} ${c.apellidos} ${c.cedula}`.toLowerCase().includes(term)
    );
  }

  selectClient(uid: string): void {
    this.selectedClientUid = uid;
    const c = this.clients.find(x => x.uid === uid);
    this.searchTerm = c ? `${c.nombre} ${c.apellidos}` : '';
    this.filteredClients = [];
    this.loadClientGoals();
  }

  guardarObjetivo(): void {
    if (!this.selectedClientUid) {
      this.toast('Selecciona un cliente.', 'warning');
      return;
    }
    if (!this.nuevoObjetivo.tipo || !this.nuevoObjetivo.meta || !this.nuevoObjetivo.meses) {
      this.toast('Completa todos los campos.', 'warning');
      return;
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
        this.modal('¡Objetivo creado!', 'El objetivo se creó correctamente.', 'success');
        this.switchPrincipal('objetivos');
        this.loadClientGoals();
      })
      .catch(() => this.modal('Error', 'No se pudo crear el objetivo.', 'error'));
  }

  loadClientGoals(): void {
    if (!this.selectedClientUid) return;
    this.isLoading = true;
    this.cd.detectChanges();

    this.subs.add(
      this.svc.getGoals(this.selectedClientUid).subscribe(goals => {
        this.objetivos = goals.filter(g => g.estado === 'en progreso');
        this.historico = goals.filter(g => g.estado === 'completado');
        this.progresoTemp = {};
        this.objetivos.forEach(o => {
          if (o.id) this.progresoTemp[o.id] = o.progreso;
        });
        this.updatePagination();
        this.updatePaginationHist();
        this.isLoading = false;

        this.recomendaciones = [];
        this.objetivos.forEach(obj => {
          this.svc
            .listRecommendations(this.selectedClientUid!, obj.id!)
            .subscribe(arr => {
              this.recomendaciones.push(...arr);
              this.cd.detectChanges();
            });
        });

        this.cd.detectChanges();
      })
    );
  }

  updateProgreso(o: Goal): void {
    if (!this.selectedClientUid) return;
    const id = o.id!;
    const valor = Math.max(0, Math.min(100, this.progresoTemp[id] ?? o.progreso));
    this.svc
      .updateGoal(this.selectedClientUid, id, { progreso: valor })
      .then(() => this.toast('Progreso actualizado', 'success'))
      .catch(() => this.toast('Error al actualizar', 'error'));
  }

  confirmarCompletar(o: Goal): void {
    Swal.fire({
      title: '¿Deseas completar este objetivo?',
      text: 'Se moverá al histórico.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, completarlo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed && this.selectedClientUid) {
        const hoy = new Date().toISOString().split('T')[0];
        this.svc
          .updateGoal(this.selectedClientUid, o.id!, {
            progreso: 100,
            estado: 'completado',
            fecha: hoy
          })
          .then(() => {
            this.modal('¡Objetivo completado!', 'Se movió al histórico.', 'success');
            this.loadClientGoals();
          })
          .catch(() => this.modal('Error', 'No se pudo completar el objetivo.', 'error'));
      }
    });
  }

  openRecModal(goal: Goal): void {
    this.recModalGoal = goal;
    this.newComentario = '';
    this.showInputRec = false;
    this.showRecModal = true;
    this.currentPageRecs = 1;
    this.loadRecs(goal);
    this.cd.detectChanges();
  }

  private loadRecs(goal: Goal): void {
    if (!this.selectedClientUid) return;
    this.isLoading = true;
    this.cd.detectChanges();

    this.subs.add(
      this.svc.listRecommendations(this.selectedClientUid!, goal.id!).subscribe(arr => {
        this.recomendaciones = arr.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.updatePaginatedRecs();
        this.isLoading = false;
        this.cd.detectChanges();
      })
    );
  }

  saveRecomendacion(): void {
    if (!this.selectedClientUid) return;
    if (!this.newComentario.trim()) {
      this.toast('Escribe tu recomendación.', 'warning');
      return;
    }
    this.svc
      .addRecommendation(this.selectedClientUid, this.recModalGoal.id!, {
        comentario: this.newComentario.trim(),
        tipo: this.recModalGoal.tipo,
        meta: this.recModalGoal.meta
      })
      .then(() => {
        this.newComentario = '';
        this.showInputRec = false;
        this.toast('Recomendación agregada', 'success');
        this.loadRecs(this.recModalGoal);
      })
      .catch(() => this.toast('Error al guardar recomendación', 'error'));
  }

  cancelAddRec(): void {
    this.showInputRec = false;
    this.newComentario = '';
  }

  updatePaginatedRecs(): void {
    this.totalPagesRecs = Math.ceil(this.recomendaciones.length / this.itemsPerPageRecs) || 1;
    const start = (this.currentPageRecs - 1) * this.itemsPerPageRecs;
    this.paginatedRecs = this.recomendaciones.slice(start, start + this.itemsPerPageRecs);
  }

  nextPageRecs(): void {
    if (this.currentPageRecs < this.totalPagesRecs) {
      this.currentPageRecs++;
      this.updatePaginatedRecs();
    }
  }

  prevPageRecs(): void {
    if (this.currentPageRecs > 1) {
      this.currentPageRecs--;
      this.updatePaginatedRecs();
    }
  }

  updatePagination(): void {
    this.totalPagesObj = Math.ceil(this.objetivos.length / this.itemsPerPageObj) || 1;
    const start = (this.currentPageObj - 1) * this.itemsPerPageObj;
    this.paginatedObjetivos = this.objetivos.slice(start, start + this.itemsPerPageObj);
  }

  updatePaginationHist(): void {
    this.totalPagesHist = Math.ceil(this.historico.length / this.itemsPerPageHist) || 1;
    const start = (this.currentPageHist - 1) * this.itemsPerPageHist;
    this.paginatedHistorico = this.historico.slice(start, start + this.itemsPerPageHist);
  }

  prevPageObj(): void {
    if (this.currentPageObj > 1) {
      this.currentPageObj--;
      this.updatePagination();
    }
  }

  nextPageObj(): void {
    if (this.currentPageObj < this.totalPagesObj) {
      this.currentPageObj++;
      this.updatePagination();
    }
  }

  prevPageHist(): void {
    if (this.currentPageHist > 1) {
      this.currentPageHist--;
      this.updatePaginationHist();
    }
  }

  nextPageHist(): void {
    if (this.currentPageHist < this.totalPagesHist) {
      this.currentPageHist++;
      this.updatePaginationHist();
    }
  }

  goToPageObj(page: number): void {
    this.currentPageObj = page;
    this.updatePagination();
  }

  goToPageHist(page: number): void {
    this.currentPageHist = page;
    this.updatePaginationHist();
  }

  get totalPagesArrayObj(): number[] {
    return Array.from({ length: this.totalPagesObj }, (_, i) => i + 1);
  }

  get totalPagesArrayHist(): number[] {
    return Array.from({ length: this.totalPagesHist }, (_, i) => i + 1);
  }

  switchPrincipal(tab: 'crear' | 'objetivos' | 'historico'): void {
    this.tabPrincipal = tab;

    this.searchTerm = '';
    this.filteredClients = [];
    this.selectedClientUid = null;
    this.nuevoObjetivo = { tipo: '', meta: '', meses: null };
    this.objetivos = [];
    this.historico = [];
    this.recomendaciones = [];
    this.paginatedObjetivos = [];
    this.paginatedHistorico = [];
    this.paginatedRecs = [];
    this.progresoTemp = {};
    this.showRecModal = false;
    this.showInputRec = false;
    this.newComentario = '';
    this.currentPageObj = 1;
    this.currentPageHist = 1;
    this.currentPageRecs = 1;

    this.cd.detectChanges();


  }

  private addMonths(d: Date, m: number): Date {
    const y = d.getFullYear();
    const mo = d.getMonth() + m;
    return new Date(y, mo, d.getDate());
  }

  private modal(title: string, text: string, icon: any): void {
    Swal.fire({ icon, title, text, confirmButtonColor: '#a1c037' });
  }

  private toast(title: string, icon: any = 'info'): void {
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
