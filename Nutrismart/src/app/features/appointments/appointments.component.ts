// src/app/features/appointments/appointments.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AppointmentsService, Appointment } from '../../services/appointments.service';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  fechaSeleccionada = '';
  today = '';
  horaSeleccionada = '';
  showPopup = false;
  popupMessage = '';
  citasTodas: Appointment[] = [];
  citasUsuario: Appointment[] = [];
  private uid = '';
  private userEmail = '';
  private subs = new Subscription();
  horarios = [
    '08:00 AM','09:00 AM','10:00 AM',
    '11:00 AM','01:00 PM','02:00 PM',
    '03:00 PM','04:00 PM','05:00 PM'
  ];
  enEdicion = false;
  citaEnEdicion?: Appointment;
  todosHorasPasaron = false;

  constructor(
    private authService: AuthService,
    private apptService: AppointmentsService,
    private emailService: EmailService
  ) {}

  ngOnInit(): void {
    this.today = this.getToday();
    this.fechaSeleccionada = this.today;
    this.onFechaChange();

    // 1) Auto-completar pasadas (+1h)
    this.subs.add(
      this.apptService.getAllAppointments().subscribe(apps => {
        const ahora = Date.now();
        apps.forEach(c => {
          const inicio = new Date(c.datetime).getTime();
          if (c.status === 'confirmed' && inicio + 60*60*1000 < ahora) {
            this.apptService.updateAppointment(c.id!, { status: 'completed' });
          }
        });
        this.citasTodas = apps;
        this.loadCitasDeUsuario();
      })
    );

    // 2) Usuario y email
    this.subs.add(
      this.authService.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.userEmail = user.email ?? '';
          this.loadCitasDeUsuario();
        } else {
          this.citasUsuario = [];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  private loadCitasDeUsuario(): void {
    if (!this.uid) {
      this.citasUsuario = [];
      return;
    }
    this.subs.add(
      this.apptService.getUserAppointments(this.uid).subscribe(listUsr => {
        // Orden: confirmed, completed, canceled; luego fecha descendente
        const order = { confirmed:0, completed:1, canceled:2 };
        this.citasUsuario = listUsr.sort((a,b) => {
          if (order[a.status] !== order[b.status]) {
            return order[a.status] - order[b.status];
          }
          return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
        });
      })
    );
  }

  onFechaChange(): void {
    this.horaSeleccionada = '';
    this.enEdicion = false;
    this.citaEnEdicion = undefined;
    this.showPopup = false;
    this.popupMessage = '';
    this.verificarSiHorasPasaron();
  }

  private verificarSiHorasPasaron(): void {
    if (!this.fechaSeleccionada) {
      this.todosHorasPasaron = false;
      return;
    }
    const ahora = new Date();
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const inicioHoy = new Date(ahora.toISOString().split('T')[0] + 'T00:00:00');
    if (sel > ahora) {
      this.todosHorasPasaron = false;
    } else if (sel < inicioHoy) {
      this.todosHorasPasaron = true;
    } else {
      const mn = ahora.getHours()*60 + ahora.getMinutes();
      this.todosHorasPasaron = !this.horarios.some(h => this.horaEnMinutos(h) > mn);
    }
  }

  isHorarioDisponible(h: string): boolean {
    if (!this.fechaSeleccionada) return false;
    const ahora = new Date();
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const mn = ahora.getHours()*60 + ahora.getMinutes();
    if (sel.toDateString() === ahora.toDateString() && this.horaEnMinutos(h) <= mn) {
      return false;
    }
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(h)}:00`).toISOString();
    if (this.enEdicion && this.citaEnEdicion?.datetime === iso) {
      return true;
    }
    return !this.citasTodas.some(c => c.datetime === iso && c.status !== 'canceled');
  }

  private horaEnMinutos(h12: string): number {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(v => +v);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return h*60 + m;
  }

  public puedeCancelar(c: Appointment): boolean {
    return new Date(c.datetime).getTime() - Date.now() >= 24*60*60*1000;
  }

  editarCita(c: Appointment): void {
    if (!this.puedeCancelar(c)) {
      this.displayPopup('⚠️ Solo se permite editar con ≥24 h de antelación.');
      return;
    }
    this.enEdicion = true;
    this.citaEnEdicion = c;
    const dt = new Date(c.datetime);
    this.fechaSeleccionada = dt.toISOString().split('T')[0];
    this.horaSeleccionada = this.formateaHora(c.datetime);
    this.displayPopup(`🖊️ Editando cita para ${this.formateaFecha(c.datetime)} a las ${this.horaSeleccionada}.`);
    this.verificarSiHorasPasaron();
  }

  cancelarCitaEspecifica(c: Appointment): void {
    if (!this.puedeCancelar(c)) {
      this.displayPopup('⚠️ Solo se permite cancelar con ≥24 h de antelación.');
      return;
    }
    this.apptService.updateAppointment(c.id!, { status: 'canceled' })
      .then(() => {
        this.emailService.send(
          this.userEmail,
          'Cita cancelada',
          `Su cita del ${this.formateaFecha(c.datetime)} a las ${this.formateaHora(c.datetime)} ha sido cancelada.`
        ).subscribe();
        this.displayPopup(`❌ Cita cancelada para ${this.formateaFecha(c.datetime)} a las ${this.formateaHora(c.datetime)}.`);
        this.loadCitasDeUsuario();
      })
      .catch(() => this.displayPopup('🚨 Error al cancelar la cita.'));
  }

  guardarCita(): void {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) return;
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();
    const finish = () => {
      this.displayPopup(this.enEdicion
        ? `✅ Cita reprogramada a ${this.formateaFecha(iso)} ${this.horaSeleccionada}.`
        : '✅ Cita confirmada con éxito.'
      );
      if (this.enEdicion) this.cancelarEdicion();
      else this.fechaSeleccionada = this.today;
      this.horaSeleccionada = '';
      this.loadCitasDeUsuario();
    };

    if (this.enEdicion && this.citaEnEdicion?.id) {
      this.apptService.updateAppointment(this.citaEnEdicion.id, { datetime: iso })
        .then(() => {
          this.emailService.send(
            this.userEmail,
            'Cita reprogramada',
            `Su cita ha sido reprogramada para el ${this.formateaFecha(iso)} a las ${this.formateaHora(iso)}.`
          ).subscribe();
          finish();
        })
        .catch(() => this.displayPopup('🚨 Error al actualizar la cita.'));
    } else {
      this.apptService.createAppointment({ userId: this.uid, datetime: iso, status: 'confirmed' })
        .then(() => {
          this.emailService.send(
            this.userEmail,
            'Cita confirmada',
            `Su cita ha sido confirmada para el ${this.formateaFecha(iso)} a las ${this.formateaHora(iso)}.`
          ).subscribe();
          finish();
        })
        .catch(() => this.displayPopup('🚨 Error al crear la cita.'));
    }
  }

  cancelarEdicion(): void {
    this.enEdicion = false;
    this.citaEnEdicion = undefined;
    this.fechaSeleccionada = this.today;
    this.horaSeleccionada = '';
    this.verificarSiHorasPasaron();
  }
  

  private displayPopup(msg: string): void {
    this.popupMessage = msg;
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 8000);
  }

  private to24h(h12: string): string {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(v => +v);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  formateaFecha(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  formateaHora(iso: string): string {
    const d = new Date(iso);
    const h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
  }
}
