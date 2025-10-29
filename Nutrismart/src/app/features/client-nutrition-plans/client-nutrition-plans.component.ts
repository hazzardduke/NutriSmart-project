
import { Component, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ClientNutritionPlanService, SavedPlan } from '../../services/client-nutrition-plan.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PdfMergeService } from '../../services/pdf-merge.service';

@Component({
  standalone: true,
  selector: 'app-client-nutrition-plans',
  imports: [CommonModule],
  templateUrl: './client-nutrition-plans.component.html',
  styleUrls: ['./client-nutrition-plans.component.scss'],
})
export class ClientNutritionPlansComponent implements OnInit {
  plans$!: Observable<SavedPlan[]>;
  allPlans: SavedPlan[] = [];
  paginatedPlans: SavedPlan[] = [];
  errorMessage: string | null = null;
  selectedPlan: SavedPlan | null = null;
  showModal = false;
  downloading: Record<string, boolean> = {};

  private categories = ['Lácteos', 'Vegetales', 'Frutas', 'Harinas', 'Proteínas', 'Grasas'];

  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  pagesToShow: (number | string)[] = [];

  constructor(
    private planService: ClientNutritionPlanService,
    private mergeSvc: PdfMergeService
  ) {}

  ngOnInit(): void {
    this.plans$ = this.planService.getMyPlans().pipe(
      catchError(err => {
        console.error('Error cargando planes:', err);
        this.errorMessage = err?.message === 'permission-denied'
          ? 'No tienes permiso para ver tus planes. Verifica tu sesión.'
          : `Error cargando planes: ${err?.message || err}`;
        return of([] as SavedPlan[]);
      })
    );

    this.plans$.subscribe(plans => {
      this.allPlans = plans;
      this.totalPages = Math.ceil(this.allPlans.length / this.itemsPerPage);
      this.updatePaginatedPlans();
    });
  }

  updatePaginatedPlans(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedPlans = this.allPlans.slice(start, end);
    this.updatePagination();
  }

  updatePagination(): void {
    const total = this.totalPages;
    const current = this.currentPage;
    const visiblePages = 7;
    const range: (number | string)[] = [];

    if (total <= visiblePages) {
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

    this.pagesToShow = range;
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedPlans();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedPlans();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedPlans();
    }
  }

  displayDate(ts: any): string {
    if (!ts) return '';
    let dateObj: Date;
    if (typeof ts.toDate === 'function') {
      dateObj = ts.toDate();
    } else if (ts instanceof Date) {
      dateObj = ts;
    } else {
      const parsed = new Date(ts);
      if (isNaN(parsed.getTime())) return '';
      dateObj = parsed;
    }
    return formatDate(dateObj, 'dd-MM-yyyy HH:mm', 'en-US');
  }

  openModal(plan: SavedPlan) {
    this.selectedPlan = plan;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedPlan = null;
  }

  totalPorciones(cat: any) {
    return this.planService.totalPorciones(cat);
  }

  trackByPlanId(_: number, plan: SavedPlan) {
    return plan.id;
  }


 private buildTableDocDef(portions: any): any {
  const header = [
    { text: 'Alimentos', style: 'tableHeader' },
    { text: 'Porciones', style: 'tableHeader' },
    { text: 'Desayuno', style: 'tableHeader' },
    { text: 'Merienda #1', style: 'tableHeader' },
    { text: 'Almuerzo', style: 'tableHeader' },
    { text: 'Merienda #2', style: 'tableHeader' },
    { text: 'Cena', style: 'tableHeader' },
  ];

  const rows = this.categories.map(cat => {
    const r = portions?.[cat] || { desayuno: 0, merienda1: 0, almuerzo: 0, merienda2: 0, cena: 0 };
    const porc =
      (r.desayuno || 0) +
      (r.merienda1 || 0) +
      (r.almuerzo || 0) +
      (r.merienda2 || 0) +
      (r.cena || 0);
    return [
      { text: cat, style: 'tableFirstCell' },
      { text: porc.toString(), style: 'tableCell' },
      { text: (r.desayuno || 0).toString(), style: 'tableCell' },
      { text: (r.merienda1 || 0).toString(), style: 'tableCell' },
      { text: (r.almuerzo || 0).toString(), style: 'tableCell' },
      { text: (r.merienda2 || 0).toString(), style: 'tableCell' },
      { text: (r.cena || 0).toString(), style: 'tableCell' },
    ];
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 30, 40, 60],
    content: [

      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*', '*', '*', '*'],
          body: [header, ...rows],
        },
        layout: {
          fillColor: (i: number) => (i === 0 ? '#7ea230' : i % 2 === 0 ? '#f7faf2' : null),
          hLineColor: () => '#d5e1bd',
          vLineColor: () => '#d5e1bd',
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
      {
        text: '\nRecomendaciones:',
        style: 'subtitle',
        margin: [0, 12, 0, 4],
      },
      {
        text:
          'Recuerde seguir el plan de alimentación según las porciones asignadas. ' +
          'Mantenga una correcta hidratación y consulte ante cualquier duda con su nutricionista.',
        style: 'bodyText',
      },
    ],
    styles: {
      title: { fontSize: 16, bold: true, color: '#2c3e50', alignment: 'center' },
      subtitle: { fontSize: 12, bold: true, color: '#7ea230' },
      bodyText: { fontSize: 10, color: '#333', alignment: 'justify', lineHeight: 1.3 },
      tableHeader: { fontSize: 11, bold: true, color: '#fff', alignment: 'center' },
      tableFirstCell: { fontSize: 10, bold: true, color: '#2c3e50', alignment: 'left', margin: [5, 3, 0, 3] },
      tableCell: { fontSize: 10, color: '#333', alignment: 'center', margin: [0, 3, 0, 3] },
    },
    defaultStyle: { fontSize: 10 },
  };
}


  private sanitizeFileName(name: string): string {
    return name.replace(/[^\w\-\.]/g, '_');
  }

  async downloadPdf(plan: SavedPlan) {
    if (!plan.id) return;
    const safeName = this.sanitizeFileName(plan.client.name);
    const filename = `plan-${safeName}.pdf`;
    this.downloading[plan.id] = true;

    try {
      await this.mergeSvc.fillAndInsertTable(
        'assets/Recomendaciones.pdf',
        plan.client.name,
        plan.client.date,
        this.buildTableDocDef(plan.portions),
        filename
      );
    } catch (err) {
      console.error('Error generando el PDF:', err);
      this.errorMessage = 'Ocurrió un error al generar el PDF. Intenta de nuevo más tarde.';
    } finally {
      this.downloading[plan.id] = false;
    }
  }
}
