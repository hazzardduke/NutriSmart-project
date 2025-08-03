// src/app/features/client-nutrition-plans/client-nutrition-plans.component.ts
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
  errorMessage: string | null = null;
  selectedPlan: SavedPlan | null = null;
  showModal = false;

  // Estado de generación/descarga por plan
  downloading: Record<string, boolean> = {};

  // Categorías (deben coincidir con las que se usan en los planes)
  private categories = ['Lácteos', 'Vegetales', 'Frutas', 'Harinas', 'Proteínas', 'Grasas'];

  constructor(
    private planService: ClientNutritionPlanService,
    private mergeSvc: PdfMergeService
  ) {}

  ngOnInit(): void {
    this.plans$ = this.planService.getMyPlans().pipe(
      catchError(err => {
        console.error('Error cargando planes:', err);
        if (err?.message === 'permission-denied') {
          this.errorMessage = 'No tienes permiso para ver tus planes. Verifica tu sesión.';
        } else {
          this.errorMessage = `Error cargando planes: ${err?.message || err}`;
        }
        // para que la plantilla no rompa, devolvemos lista vacía
        return of([] as SavedPlan[]);
      })
    );
  }

  displayDate(ts: any): string {
    if (!ts) return '';
    let dateObj: Date;
    if (typeof ts.toDate === 'function') {
      dateObj = ts.toDate();
    } else if (ts instanceof Date) {
      dateObj = ts;
    } else {
      // intento de parseo como string/number fallback
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
      pageMargins: [40, 60, 40, 60],
      content: [
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*'],
            body: [header, ...rows],
          },
          layout: {
            fillColor: (i: number) =>
              i === 0 ? '#a1c037' : i % 2 === 0 ? '#F0F5F0' : null,
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
          margin: [0, 0, 0, 20],
        },
      ],
      styles: {
        tableHeader: { fontSize: 12, bold: true, color: '#fff', alignment: 'center' },
        tableFirstCell: { fontSize: 11, bold: true, alignment: 'left', margin: [0, 4, 0, 4] },
        tableCell: { fontSize: 10, alignment: 'center', margin: [0, 4, 0, 4] },
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
      console.error('Error regenerando el PDF en el cliente:', err);
      // opcional: en lugar de alert puedes propagar a errorMessage para mostrar en UI
      this.errorMessage = 'Ocurrió un error al generar el PDF. Intenta de nuevo más tarde.';
    } finally {
      this.downloading[plan.id] = false;
    }
  }
}
