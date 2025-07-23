// src/app/features/nutrition-plan-form/nutrition-plan-form.component.ts

import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  FormControl
} from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
  serverTimestamp,
  addDoc
} from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PdfMergeService } from '../../services/pdf-merge.service';
import { ProfileService, ClientProfile } from '../../services/profile.service';

export interface SavedPlan {
  id: string;
  clientId: string;
  client: { name: string; cedula: string; date: string };
  createdAt: any;
  portions: {
    [cat: string]: {
      desayuno: number;
      merienda1: number;
      almuerzo: number;
      merienda2: number;
      cena: number;
    };
  };
}

@Component({
  standalone: true,
  selector: 'app-nutrition-plan-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './nutrition-plan-form.component.html',
  styleUrls: ['./nutrition-plan-form.component.scss']
})
export class NutritionPlanFormComponent implements OnInit {
  clients: ClientProfile[] = [];
  selectedClient?: ClientProfile;
  portionsForm!: FormGroup;
  categories = ['Lácteos','Vegetales','Frutas','Harinas','Proteínas','Grasas'];
  numbers = Array.from({ length: 11 }, (_, i) => i);
  currentTab: 'create' | 'history' = 'create';

  plans$!: Observable<SavedPlan[]>;
  filterControl = new FormControl('');
  filteredPlans$!: Observable<SavedPlan[]>;

  modalPlan: SavedPlan | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private afs: Firestore,
    private mergeSvc: PdfMergeService
  ) {}

  ngOnInit(): void {
    this.profileService.getClients().subscribe(list => this.clients = list);
    this.portionsForm = this.fb.group({});

    const colRef = collection(this.afs, 'nutritionPlans');
    const q      = query(colRef, orderBy('createdAt','desc'));
    this.plans$ = collectionData(q, { idField: 'id' }) as Observable<SavedPlan[]>;

    this.filteredPlans$ = combineLatest([
      this.plans$,
      this.filterControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([plans, clientId]) =>
        plans.filter(p => !clientId || p.clientId === clientId)
      )
    );
  }

  setTab(tab: 'create' | 'history'): void {
    this.currentTab = tab;
    this.modalPlan = null;
  }

  onClientSelect(sel: HTMLSelectElement): void {
    const id = sel.value;
    this.selectedClient = this.clients.find(c => c.id === id);
    if (!this.selectedClient) {
      this.portionsForm = this.fb.group({});
      return;
    }
    const group: Record<string, FormGroup> = {};
    this.categories.forEach(cat => {
      group[cat] = this.fb.group({
        desayuno:  [0],
        merienda1: [0],
        almuerzo:  [0],
        merienda2: [0],
        cena:      [0],
      });
    });
    this.portionsForm = this.fb.group(group);
  }

  computePorciones(cat: string): number {
    const fg = this.portionsForm.get(cat) as FormGroup;
    return ['desayuno','merienda1','almuerzo','merienda2','cena']
      .map(k => Number(fg.get(k)!.value))
      .reduce((a, b) => a + b, 0);
  }

  async onExportTablaYRecomendaciones(): Promise<void> {
    if (!this.selectedClient) return;
    const client = this.selectedClient;
    const name   = `${client.nombre}_${client.apellido}`.replace(/\s+/g, '_');
    const cedula = client.cedula;
    const now    = new Date();
    const dd     = String(now.getDate()).padStart(2,'0');
    const mm     = String(now.getMonth()+1).padStart(2,'0');
    const yyyy   = now.getFullYear();
    const date   = `${dd}-${mm}-${yyyy}`;

    // Construir datos de porciones
    const raw = this.portionsForm.value as Record<string, any>;
    const portionsData: SavedPlan['portions'] = {};
    this.categories.forEach(cat => {
      const r = raw[cat] || {};
      portionsData[cat] = {
        desayuno:  Number(r.desayuno)  || 0,
        merienda1: Number(r.merienda1) || 0,
        almuerzo:  Number(r.almuerzo)  || 0,
        merienda2: Number(r.merienda2) || 0,
        cena:      Number(r.cena)      || 0,
      };
    });

    // Guardar en Firestore
    const docRef = await addDoc(collection(this.afs, 'nutritionPlans'), {
      clientId:  client.id,
      client:    { name: `${client.nombre} ${client.apellido}`, cedula, date },
      portions:  portionsData,
      createdAt: serverTimestamp()
    });

    // Nombre de archivo: Nombre_Apellido_Cedula_Fecha.pdf
    const filename = `${name}_${cedula}_${date}.pdf`;

    // Generar y descargar PDF
    await this.mergeSvc.fillAndInsertTable(
      'assets/Recomendaciones.pdf',
      `${client.nombre} ${client.apellido}`,
      date,
      this.buildTableDocDef(portionsData),
      filename
    );

    // Mostrar SweetAlert
    await Swal.fire({
      icon: 'success',
      title: '¡Plan guardado y PDF descargado!',
      showConfirmButton: false,
      timer: 1500,
      background: '#fff',
      iconColor: '#a1c037',
      confirmButtonColor: '#a1c037'
    });

    // Limpiar y cambiar a Histórico
    this.selectedClient = undefined;
    this.portionsForm.reset();
    this.setTab('history');
  }

  async downloadPdf(plan: SavedPlan): Promise<void> {
    const [first, last] = plan.client.name.split(' ');
    const safeName      = `${first}_${last}`.replace(/\s+/g, '_');
    const cedula        = plan.client.cedula;
    const date          = plan.client.date;
    const filename      = `${safeName}_${cedula}_${date}.pdf`;

    await this.mergeSvc.fillAndInsertTable(
      'assets/Recomendaciones.pdf',
      plan.client.name,
      date,
      this.buildTableDocDef(plan.portions),
      filename
    );
  }

  openModal(plan: SavedPlan): void {
    this.modalPlan = plan;
  }

  closeModal(): void {
    this.modalPlan = null;
  }

  private buildTableDocDef(portions: SavedPlan['portions']): TDocumentDefinitions {
    const header = [
      { text: 'Alimentos', style: 'tableHeader' },
      { text: 'Porciones', style: 'tableHeader' },
      { text: 'Desayuno',  style: 'tableHeader' },
      { text: 'Merienda #1', style: 'tableHeader' },
      { text: 'Almuerzo',  style: 'tableHeader' },
      { text: 'Merienda #2', style: 'tableHeader' },
      { text: 'Cena',      style: 'tableHeader' },
    ];

    const rows = this.categories.map(cat => {
      const r = portions[cat];
      const porc = r.desayuno + r.merienda1 + r.almuerzo + r.merienda2 + r.cena;
      return [
        { text: cat,             style: 'tableFirstCell' },
        { text: porc.toString(), style: 'tableCell' },
        { text: r.desayuno.toString(),  style: 'tableCell' },
        { text: r.merienda1.toString(), style: 'tableCell' },
        { text: r.almuerzo.toString(),  style: 'tableCell' },
        { text: r.merienda2.toString(), style: 'tableCell' },
        { text: r.cena.toString(),      style: 'tableCell' },
      ];
    });

    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        {
          table: {
            headerRows: 1,
            widths: ['*','*','*','*','*','*','*'],
            body: [header, ...rows]
          },
          layout: {
            fillColor: (i: number) =>
              i === 0 ? '#a1c037'
            : i % 2 === 0 ? '#F0F5F0'
            : null,
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC',
            paddingLeft:   () => 8,
            paddingRight:  () => 8,
            paddingTop:    () => 6,
            paddingBottom: () => 6,
          },
          margin: [0,0,0,20]
        }
      ],
      styles: {
        tableHeader:    { fontSize:12, bold:true, color:'#fff', alignment:'center' },
        tableFirstCell: { fontSize:11, bold:true, alignment:'left', margin:[0,4,0,4] },
        tableCell:      { fontSize:10, alignment:'center', margin:[0,4,0,4] }
      },
      defaultStyle: { fontSize: 10 }
    };
  }
}
