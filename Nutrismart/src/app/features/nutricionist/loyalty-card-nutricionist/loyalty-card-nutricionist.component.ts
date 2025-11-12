import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Swal from 'sweetalert2';
import {
  LoyaltyCardNutricionistService,
  UserSummary,
  ClientWithStamps
} from '../../../services/loyalty-card-nutricionist.service';

@Component({
  selector: 'app-loyalty-card-nutricionist',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './loyalty-card-nutricionist.component.html',
  styleUrls: ['./loyalty-card-nutricionist.component.scss']
})
export class LoyaltyCardNutricionistComponent implements OnInit, OnDestroy {
  activeTab: 'manage' | 'overview' = 'manage';
  clients$!: Observable<UserSummary[]>;
  allClients: (UserSummary & { stamps?: number })[] = [];
  filteredClients: (UserSummary & { stamps?: number })[] = [];
  searchTerm = '';
  selectedId = '';
  selectedClient?: (UserSummary & { stamps?: number });
  overview$!: Observable<ClientWithStamps[]>;
  filterControl = new FormControl('');
  private pageIndex$ = new BehaviorSubject<number>(0);
  pageIndex = 0;
  pageSize = 5;
  filteredOverview$!: Observable<ClientWithStamps[]>;
  pagedOverview$!: Observable<ClientWithStamps[]>;
  totalItems$!: Observable<number>;
  totalPages$!: Observable<number>;
  private subs = new Subscription();

  constructor(private svc: LoyaltyCardNutricionistService) {}

  ngOnInit(): void {
    this.overview$ = this.svc.getClientsWithStamps();
    this.subs.add(
      this.svc.getClientsWithStamps().subscribe(stampedClients => {
        this.svc.listClients().subscribe(clients => {
          this.allClients = clients.map(c => {
            const match = stampedClients.find(s => s.uid === c.uid);
            return { ...c, stamps: match?.stamps ?? 0 };
          });
        });
      })
    );

    this.filteredOverview$ = combineLatest([
      this.overview$,
      this.filterControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([rows, term]) => {
        const t = (term || '').toString().toLowerCase().trim();
        if (!t) return rows;
        return rows.filter(c =>
          `${c.nombre} ${c.apellidos} ${c.cedula}`.toLowerCase().includes(t)
        );
      })
    );

    this.totalItems$ = this.filteredOverview$.pipe(map(arr => arr.length));
    this.totalPages$ = this.totalItems$.pipe(
      map(total => Math.max(1, Math.ceil(total / this.pageSize)))
    );

    this.pagedOverview$ = combineLatest([
      this.filteredOverview$,
      this.pageIndex$
    ]).pipe(
      map(([rows, idx]) => {
        const start = idx * this.pageSize;
        return rows.slice(start, start + this.pageSize);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  switchTab(tab: 'manage' | 'overview'): void {
    this.activeTab = tab;
    if (tab === 'manage') this.clearClientSelection();
    if (tab === 'overview') this.setPage(0);
  }

  onTabKeydown(event: KeyboardEvent, tab: 'manage' | 'overview'): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.switchTab(tab);
    }
  }

  onSearchFocus(): void {
    this.filteredClients = this.allClients.slice();
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredClients = term
      ? this.allClients.filter(c =>
          `${c.nombre} ${c.apellidos} ${c.cedula}`.toLowerCase().includes(term)
        )
      : this.allClients.slice();
  }

  selectClient(uid: string): void {
    const c = this.allClients.find(x => x.uid === uid);
    if (!c) return;
    this.selectedId = uid;
    this.selectedClient = c;
    this.searchTerm = `${c.nombre} ${c.apellidos} (${c.cedula})`;
    this.filteredClients = [];
  }

  clearClientSelection(): void {
    this.selectedId = '';
    this.selectedClient = undefined;
    this.searchTerm = '';
    this.filteredClients = [];
  }

  async addStamp(): Promise<void> {
    if (!this.selectedClient) return;
    const currentStamps = this.selectedClient.stamps ?? 0;
    if (currentStamps >= 7) {
      await Swal.fire({
        icon: 'info',
        title: 'Cantidad de sellos al máximo',
        text: 'Esperando que el cliente canjee su premio.',
        confirmButtonColor: '#a1c037'
      });
      return;
    }
    try {
      await this.svc.addStampTo(this.selectedId);
      await Swal.fire({
        icon: 'success',
        title: '¡Sello agregado!',
        text: 'Se añadió un sello a la tarjeta del cliente.',
        confirmButtonColor: '#a1c037'
      });
      this.selectedClient.stamps = currentStamps + 1;
      if (this.selectedClient.stamps >= 7) {
        await Swal.fire({
          icon: 'info',
          title: 'Cantidad de sellos al máximo',
          text: 'Esperando que el cliente canjee su premio.',
          confirmButtonColor: '#a1c037'
        });
      }
      this.clearClientSelection();
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Error al añadir sello',
        text: 'Intenta nuevamente en unos segundos.',
        confirmButtonColor: '#a1c037'
      });
    }
  }

  setPage(index: number): void {
    this.pageIndex = Math.max(0, index);
    this.pageIndex$.next(this.pageIndex);
  }

  prevPage(totalPages: number): void {
    if (this.pageIndex > 0) this.setPage(this.pageIndex - 1);
  }

  nextPage(totalPages: number): void {
    if (this.pageIndex < totalPages - 1) this.setPage(this.pageIndex + 1);
  }
}
