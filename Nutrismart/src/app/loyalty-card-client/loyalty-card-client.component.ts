import { Component, OnInit }   from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterLink }           from '@angular/router';
import { LoyaltyCardService, LoyaltyCard } from '../services/loyalty-card.service';
import { Observable }           from 'rxjs';

@Component({
  selector: 'app-loyalty-card-client',
  standalone: true,
  imports: [ CommonModule, RouterLink ],
  templateUrl: './loyalty-card-client.component.html',
  styleUrls: ['./loyalty-card-client.component.scss']
})
export class LoyaltyCardClientComponent implements OnInit {
  card$!: Observable<LoyaltyCard|null>;

  constructor(private svc: LoyaltyCardService) {}
  stars = Array(7); 

  ngOnInit() {
    this.card$ = this.svc.getMyCard();
  }

  redeem() {
    
    console.log('Comando de canje ejecutado');
  }

  addStamp() {
    this.svc.addStamp()
      .then(() => {/* opcional: mostrar un toast */})
      .catch(err => console.error(err));
  }

}
