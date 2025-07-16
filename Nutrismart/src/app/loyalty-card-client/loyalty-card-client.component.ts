import { Component, OnInit }      from '@angular/core';
import { CommonModule }            from '@angular/common';
import { RouterLink }              from '@angular/router';
import { LoyaltyCardService }      from '../services/loyalty-card.service';
import { Observable }              from 'rxjs';

@Component({
  selector: 'app-loyalty-card-client',
  standalone: true,
  imports: [ CommonModule, RouterLink ],
  templateUrl: './loyalty-card-client.component.html',
  styleUrls: ['./loyalty-card-client.component.scss']
})
export class LoyaltyCardClientComponent implements OnInit {
  card$!: Observable<any|null>;
  stars = Array(7);

  constructor(private svc: LoyaltyCardService) {}

  ngOnInit() {
    this.card$ = this.svc.getMyCard();
  }

  createCard() {
    this.svc.createCard()
      .then(() => this.card$ = this.svc.getMyCard())
      .catch(err => console.error(err));
  }

  redeem() {
    this.svc.redeem()
      .then(() => this.card$ = this.svc.getMyCard())
      .catch(err => alert(err.message));
  }
}
