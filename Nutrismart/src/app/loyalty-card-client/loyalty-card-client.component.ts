import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { LoyaltyCardService, LoyaltyCard, RedeemEntry } from '../services/loyalty-card.service';
import { EmailService } from '../services/email.service';
import { ProfileService, UserProfileData } from '../services/profile.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-loyalty-card-client',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loyalty-card-client.component.html',
  styleUrls: ['./loyalty-card-client.component.scss']
})
export class LoyaltyCardClientComponent implements OnInit {
  card$!: Observable<LoyaltyCard | null>;
  history$!: Observable<RedeemEntry[]>;
  stars = Array(7);
  activeTab: 'card' | 'history' = 'card';
  successMessage = '';
  private redeemTimeout?: any;

  constructor(
    private loyaltySvc: LoyaltyCardService,
    private emailSvc: EmailService,
    private profileSvc: ProfileService,
    private authSvc: AuthService
  ) {}

  ngOnInit(): void {
    this.card$ = this.loyaltySvc.getMyCard();
    this.history$ = this.loyaltySvc.getRedeemHistory();
  }

  createCard(): void {
    this.loyaltySvc.createCard()
      .then(() => (this.card$ = this.loyaltySvc.getMyCard()))
      .catch((err: any) => console.error(err));
  }

  async redeem(): Promise<void> {
    try {
      const card = await firstValueFrom(this.card$);
      if (!card || card.stamps < 7) {
        Swal.fire({
          icon: 'warning',
          title: 'Sellos insuficientes',
          text: 'Debes acumular 7 sellos para canjear tu cita gratis.',
          confirmButtonColor: '#a1c037'
        });
        return;
      }

      await this.loyaltySvc.redeem();
      this.card$ = this.loyaltySvc.getMyCard();
      this.history$ = this.loyaltySvc.getRedeemHistory();
      

      const currentUser = await firstValueFrom(this.authSvc.user$);
      const uid = currentUser?.uid;
      if (!uid) throw new Error('No se pudo obtener el UID del usuario.');

      const userProfile: UserProfileData = await firstValueFrom(this.profileSvc.getProfile(uid));

      if (userProfile?.correo && userProfile?.nombre) {
        await this.emailSvc.sendCitaGratis(userProfile.correo, { nombre: userProfile.nombre });
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'Te hemos enviado un correo con tu cita gratis. ¡Preséntalo en tu próxima visita!',
          confirmButtonColor: '#a1c037'
        });
      } else {
        console.warn('El perfil del usuario no contiene nombre o correo.');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo canjear la recompensa.',
        confirmButtonColor: '#a1c037'
      });
    }
  }

  
}
