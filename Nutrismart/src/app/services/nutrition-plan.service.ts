import { Injectable } from '@angular/core';
import { pdfMake } from '../pdfmake-wrapper';
import {
  Firestore, collection, addDoc, updateDoc, doc
} from '@angular/fire/firestore';
import {
  Storage, ref, uploadBytes, getDownloadURL
} from '@angular/fire/storage';

export interface ClientAssessment { name: string; date: string; specifics?: string; }
export interface Meal { time: string; exchanges: string; example: string; }
export interface ExchangeGroup { title: string; rows: { food: string; qty: string }[]; }
export interface NutritionPlan {
  client: ClientAssessment;
  recommendations: string[];
  meals: Meal[];
  exchangeGroups: ExchangeGroup[];
  smoothies: string[];
  freeFoods: string[];
  groceryGuide: { header: string; items: string[] }[];
}

@Injectable({ providedIn: 'root' })
export class NutritionPlanService {
  constructor(
    private afs: Firestore,
    private storage: Storage
  ) {}

  private buildDocDefinition(plan: NutritionPlan): any {
    const sectionTitle = (txt: string) => ({
      text: txt.toUpperCase(),
      style: 'sectionTitle',
      margin: [0, 14, 0, 6],
      color: '#a1c037'
    });

    return {
      pageMargins: [40, 60, 40, 60],
      header: {
        columns: [
          { image: 'assets/logo.jpeg', width: 60 },
          { text: 'Nutrition To Go', style: 'companyName', alignment: 'right' }
        ],
        margin: [40, 10, 40, 0]
      },
      footer: (current: number, total: number) => ({
        text: `${plan.client.name}  | Página ${current} de ${total}`,
        alignment: 'center',
        margin: [0, 10]
      }),
      content: [
        { text: plan.client.name.toUpperCase(), style: 'coverName' },
        { text: plan.client.date, style: 'coverDate', margin: [0, 4, 0, 40] },

        sectionTitle('Requerimientos por comida'),
        {
          table: {
            widths: ['25%', '75%'],
            body: [
              [{ text: 'Tiempo', bold: true }, { text: 'Descripción / Porciones', bold: true }],
              ['Desayuno', '\n\n\n'],
              ['Media mañana', '\n\n\n'],
              ['Almuerzo', '\n\n\n'],
              ['Merienda', '\n\n\n'],
              ['Cena', '\n\n\n']
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        sectionTitle('Notas del nutricionista'),
        { text: plan.client.specifics || '', margin: [0, 0, 0, 20], style: 'specifics' },

        sectionTitle('Recomendaciones'),
        { ol: plan.recommendations, style: 'recList' },

        sectionTitle('Plan de alimentación diario'),
        {
          table: {
            widths: ['18%', '50%', '*'],
            body: [
              [
                { text: 'Tiempo', style: 'tblHead' },
                { text: 'Intercambios', style: 'tblHead' },
                { text: 'Ejemplo de plato', style: 'tblHead' }
              ],
              ...plan.meals.map(m => [
                { text: m.time, style: 'tblCell' },
                { text: m.exchanges, style: 'tblCell' },
                { text: m.example, style: 'tblCell' }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },

        ...plan.exchangeGroups.flatMap(g => ([
          sectionTitle(g.title),
          {
            table: {
              widths: ['65%', '35%'],
              body: g.rows.map(r => [ r.food, { text: r.qty, alignment: 'right' } ])
            },
            layout: 'noBorders'
          }
        ])),

        sectionTitle('Ideas de batidos'),
        { ul: plan.smoothies },

        sectionTitle('Alimentos libres'),
        { ul: plan.freeFoods },

        sectionTitle('Guía de supermercado'),
        ...plan.groceryGuide.map(sec => ([
          { text: sec.header, bold: true, margin: [0, 6, 0, 2] },
          { ul: sec.items }
        ]))
      ],

      styles: {
        companyName:  { fontSize: 16, bold: true, color: '#a1c037' },
        coverName:    { fontSize: 26, bold: true, alignment: 'center' },
        coverDate:    { fontSize: 14, alignment: 'center' },
        specifics:    { fontSize: 10, italics: true, lineHeight: 1.3 },
        recList:      { fontSize: 10, lineHeight: 1.4 },
        tblHead:      { bold: true, fillColor: '#E0E0E0', fontSize: 11 },
        tblCell:      { fontSize: 10, lineHeight: 1.25 },
        sectionTitle: { fontSize: 18, bold: true }
      },

      defaultStyle: { fontSize: 10 }
    };
  }

  savePlanData(plan: NutritionPlan) {
    return addDoc(collection(this.afs, 'nutritionPlans'), {
      ...plan,
      createdAt: new Date()
    });
  }

  uploadPlanPdf(plan: NutritionPlan): Promise<string> {
    return new Promise((resolve, reject) => {
      const docDef = this.buildDocDefinition(plan);
      pdfMake.createPdf(docDef).getBlob((blob: Blob) => {
        const path = `plans/${plan.client.name.replace(/\s+/g,'_')}_${Date.now()}.pdf`;
        const storageRef = ref(this.storage, path);
        uploadBytes(storageRef, blob)
          .then(() => getDownloadURL(storageRef))
          .then(url => resolve(url))
          .catch(err => reject(err));
      });
    });
  }

  async saveCompletePlan(plan: NutritionPlan) {
    const docRef = await this.savePlanData(plan);
    const pdfUrl = await this.uploadPlanPdf(plan);
    await updateDoc(doc(this.afs, 'nutritionPlans', docRef.id), { pdfUrl });
    return { id: docRef.id, pdfUrl };
  }

  async generateAndSave(plan: NutritionPlan) {
    const { id, pdfUrl } = await this.saveCompletePlan(plan);
    const docDef = this.buildDocDefinition(plan);
    pdfMake.createPdf(docDef).download(`plan-${plan.client.name}.pdf`);
    return { id, pdfUrl };
  }
}
