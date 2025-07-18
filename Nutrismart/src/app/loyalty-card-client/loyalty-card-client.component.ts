import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { Observable }         from 'rxjs';
import {
  LoyaltyCardService,
  LoyaltyCard,
  RedeemEntry
} from '../services/loyalty-card.service';

@Component({
  selector: 'app-loyalty-card-client',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './loyalty-card-client.component.html',
  styleUrls: [ './loyalty-card-client.component.scss' ]
})
export class LoyaltyCardClientComponent implements OnInit {
  card$!: Observable<LoyaltyCard | null>;
  history$!: Observable<RedeemEntry[]>;
  stars = Array(7);

  activeTab: 'card' | 'history' = 'card';
  successMessage = '';
  private redeemTimeout?: any;

  constructor(private loyaltySvc: LoyaltyCardService) {}

  ngOnInit(): void {
    this.card$    = this.loyaltySvc.getMyCard();
    this.history$ = this.loyaltySvc.getRedeemHistory();
  }

  createCard(): void {
    this.loyaltySvc.createCard()
      .then(() => this.card$ = this.loyaltySvc.getMyCard())
      .catch((err: any) => console.error(err));
  }

  redeem(): void {
    this.loyaltySvc.redeem()
      .then(() => {
        this.card$    = this.loyaltySvc.getMyCard();
        this.history$ = this.loyaltySvc.getRedeemHistory();
        this.showRedeemMsg('🎉 ¡Felicidades! Tu próxima cita nutricional será GRATIS.');
      })
      .catch((err: any) => alert(err.message));
  }

  private showRedeemMsg(msg: string): void {
    if (this.redeemTimeout) clearTimeout(this.redeemTimeout);
    this.successMessage = msg;
    this.redeemTimeout = setTimeout(() => this.successMessage = '', 6000);
  }
}
