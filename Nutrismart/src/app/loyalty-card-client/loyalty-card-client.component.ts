import { Component, OnInit }      from '@angular/core';
import { CommonModule }            from '@angular/common';
import { LoyaltyCardService }      from '../services/loyalty-card.service';
import { Observable }              from 'rxjs';

@Component({
  selector: 'app-loyalty-card-client',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './loyalty-card-client.component.html',
  styleUrls: ['./loyalty-card-client.component.scss']
})
export class LoyaltyCardClientComponent implements OnInit {
  card$!: Observable<any|null>;
  stars = Array(7);

  // PARA EL MENSAJE DE RECOMPENSA
  successMessage = '';
  private reedemTimeout?: any;

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
      .then(() => {
      
        this.card$ = this.svc.getMyCard();
        
        this.showReedemMsg(
          '🎉 ¡Felicidades, llegaste a los 7 sellos! Tu próxima cita nutricional será gratis.'
        );
      })
      .catch(err => alert(err.message));
  }

  private showReedemMsg(msg: string) {
    if (this.reedemTimeout) {
      clearTimeout(this.reedemTimeout);
    }
    this.successMessage = msg;
    this.reedemTimeout = setTimeout(() => {
      this.successMessage = '';
    }, 6000);
  }

}
