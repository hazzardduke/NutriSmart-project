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
      .then(() => alert('Sello agregado correctamente'))
      .catch(err => {
        console.error(err);
        alert('Error al añadir sello');
      });
  }
}
