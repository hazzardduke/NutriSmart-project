import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                      from '@angular/common';
import { FormsModule }                       from '@angular/forms';
import { Subscription }                      from 'rxjs';
import {
  GoalsNutricionistService,
  Goal,
  Recommendation,
  UserSummary
} from '../../services/goals-nutricionist.service';

@Component({
  selector: 'app-goals-nutricionist',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './goals-nutricionist.component.html',
  styleUrls:  [ './goals-nutricionist.component.scss' ]
})
export class GoalsNutricionistComponent implements OnInit, OnDestroy {
  clients: UserSummary[]              = [];
  selectedClientUid: string | null    = null;

  objetivos: Goal[]                   = [];
  historico: Goal[]                   = [];
  recomendaciones: Recommendation[]   = [];
  progresoTemp: Record<string, number> = {};

  tabPrincipal: 'crear' | 'objetivos' | 'historico'         = 'crear';
  subTab:      'objetivos' | 'recomendaciones'              = 'objetivos';

  mesesOptions = [1,2,3,4,5,6];
  nuevoObjetivo = { tipo: '', meta: '', meses: null as number | null };

  showRecModal   = false;
  recModalGoal!: Goal;
  newComentario = '';

  showPopup      = false;
  mensajeService = '';
  private subs   = new Subscription();

  constructor(private svc: GoalsNutricionistService) {}

  ngOnInit(): void {
    this.subs.add(
      this.svc.listClients().subscribe(list => this.clients = list)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  switchPrincipal(tab: 'crear' | 'objetivos' | 'historico'): void {
    this.tabPrincipal       = tab;
    this.selectedClientUid  = null;
    this.objetivos          = [];
    this.historico          = [];
    this.recomendaciones    = [];
    this.nuevoObjetivo      = { tipo: '', meta: '', meses: null };
    this.subTab             = 'objetivos';
  }

 onClientSelect(): void {
    if (!this.selectedClientUid) {
      this.objetivos       = [];
      this.historico       = [];
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

  guardarObjetivo(): void {
    if (!this.nuevoObjetivo.tipo || !this.nuevoObjetivo.meta || this.nuevoObjetivo.meses == null) {
      return this.alert('Completa todos los campos.');
    }
    const fechaMeta = this.addMonths(new Date(), this.nuevoObjetivo.meses)
                          .toISOString().split('T')[0];
    this.svc.addGoal(this.selectedClientUid!, {
      tipo: this.nuevoObjetivo.tipo,
      meta: this.nuevoObjetivo.meta,
      fecha: fechaMeta
    }).then(() => {
      this.alert('Objetivo creado y en progreso');
      this.switchPrincipal('objetivos');
      this.onClientSelect();
    });
  }

  updateProgreso(o: Goal): void {
    const id = o.id!;
    const valor = Math.max(0, Math.min(100, this.progresoTemp[id] ?? o.progreso));
    this.svc.updateGoal(this.selectedClientUid!, id, { progreso: valor })
      .then(() => this.onClientSelect());
  }


  completarObjetivo(o: Goal): void {
    if (!confirm('¿Seguro que deseas marcar este objetivo como completado?')) {
      return;
    }

    const hoy = new Date().toISOString().split('T')[0];

    this.svc.updateGoal(this.selectedClientUid!, o.id!, {
      progreso: 100,
      estado: 'completado',
      fecha: hoy
    }).then(() => {
      this.alert('Objetivo completado');
      this.onClientSelect();
    });
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
    if (!this.newComentario.trim()) {
      return this.alert('Escribe tu recomendación.');
    }
    this.svc
      .addRecommendation(
        this.selectedClientUid!,                 
        this.recModalGoal.id!,                   
        {
          comentario: this.newComentario.trim(), 
          tipo:       this.recModalGoal.tipo,    
          meta:       this.recModalGoal.meta     
        }
      )
      .then(() => {
        this.alert('Recomendación guardada');
        this.showRecModal = false;
        this.loadRecs();
      });
  }


  private loadRecs(): void {
    
    this.recomendaciones = [];

   
    this.objetivos.forEach(goal => {
      this.subs.add(
        this.svc
          .listRecommendations(this.selectedClientUid!, goal.id!)
          .subscribe(arr => {
         
            this.recomendaciones.push(...arr);
            
            this.recomendaciones.sort((a, b) =>
              new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
          })
      );
    });
  }

  private addMonths(d: Date, m: number): Date {
    const y0 = d.getFullYear(), m0 = d.getMonth(), d0 = d.getDate();
    const total = m0 + m, y1 = y0 + Math.floor(total/12), m1 = total % 12;
    const last = new Date(y1, m1+1, 0).getDate(), d1 = Math.min(d0, last);
    return new Date(y1, m1, d1);
  }

  private alert(msg: string): void {
    this.mensajeService = msg;
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 3000);
  }
}
