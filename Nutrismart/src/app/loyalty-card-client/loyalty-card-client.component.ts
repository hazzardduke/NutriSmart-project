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
  stars = Array(7);
  activeTab: 'card' | 'history' = 'card';
  successMessage = '';

  history: RedeemEntry[] = [];
  paginatedHistory: RedeemEntry[] = [];
  currentPage = 1;
  itemsPerPage = 4;
  totalPages = 0;
  pagesToShow: (number | string)[] = [];

  constructor(
    private loyaltySvc: LoyaltyCardService,
    private emailSvc: EmailService,
    private profileSvc: ProfileService,
    private authSvc: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.card$ = this.loyaltySvc.getMyCard();
    this.history = await firstValueFrom(this.loyaltySvc.getRedeemHistory());
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.history.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedHistory = this.history.slice(start, end);
    this.pagesToShow = this.generatePageRange(this.currentPage, this.totalPages);
  }

  generatePageRange(current: number, total: number): (number | string)[] {
    const range: (number | string)[] = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      if (current > 2) range.push(1, '...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (current < total - 1) range.push('...', total);
    }
    return range;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
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
      this.history = await firstValueFrom(this.loyaltySvc.getRedeemHistory());
      this.updatePagination();

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
