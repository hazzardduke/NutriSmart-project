import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { Observable }         from 'rxjs';

import {
  LoyaltyCardNutricionistService,
  UserSummary,
  ClientWithStamps
} from '../services/loyalty-card-nutricionist.service';

@Component({
  selector: 'app-loyalty-card-nutricionist',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './loyalty-card-nutricionist.component.html',
  styleUrls: ['./loyalty-card-nutricionist.component.scss']
})
export class LoyaltyCardNutricionistComponent implements OnInit {
  
  clients$!:   Observable<UserSummary[]>;
  selectedId = '';

  
  overview$!:  Observable<ClientWithStamps[]>;

  
  activeTab: 'manage' | 'overview' = 'manage';

  successMessage = '';
  private clearMsgTimeout?: any;

  constructor(private svc: LoyaltyCardNutricionistService) {}

  ngOnInit() {
    this.clients$  = this.svc.listClients();
    this.overview$ = this.svc.getClientsWithStamps();
  }

  switchTab(tab: 'manage' | 'overview') {
    this.activeTab = tab;
  }



  addStamp() {
    if (!this.selectedId) return;
    this.svc.addStampTo(this.selectedId)
      .then(() => {
        this.showInfo('✅ Sello agregado correctamente');
      })
      .catch(err => {
        console.error(err);
        this.showInfo('⚠️ Error al añadir sello');
      });
  }

   private showInfo(msg: string) {
    if (this.clearMsgTimeout) clearTimeout(this.clearMsgTimeout);

    this.successMessage = msg;
    this.clearMsgTimeout = setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

}
