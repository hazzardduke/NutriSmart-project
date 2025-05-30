// src/app/core/appointments/appointments.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { FormsModule }                   from '@angular/forms';
import { Subscription }                  from 'rxjs';
import { AuthService }                   from '../../services/auth.service';
import { AppointmentsService, Appointment } from '../../services/appointments.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  fechaSeleccionada = '';
  horaSeleccionada  = '';
  citas: Appointment[] = [];
  mensaje = '';
  private uid = '';
  private subs = new Subscription();

  horarios = [
    '08:00 AM','09:00 AM','10:00 AM',
    '11:00 AM','01:00 PM','02:00 PM','03:00 PM'
  ];

  constructor(
    private auth: AuthService,
    private apptSvc: AppointmentsService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.auth.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.loadCitas();
        }
      })
    );
  }

  private loadCitas() {
    this.subs.add(
      this.apptSvc.getUserAppointments(this.uid)
        .subscribe(list => this.citas = list)
    );
  }

  isHorarioDisponible(hora: string): boolean {
    if (!this.fechaSeleccionada) return true;
    return !this.citas.some(c => this.matches(c, hora) && c.status !== 'canceled');
  }

  programarCita() {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) return;
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();
    this.apptSvc.createAppointment({
      userId: this.uid,
      datetime: iso,
      status: 'pending'
    })
    .then(() => {
      this.mensaje = '✅ Cita programada con éxito.';
      this.loadCitas();
      this.horaSeleccionada = '';
    });
  }

  cancelarCita() {
    const cita = this.findPending();
    if (!cita?.id) return;
    this.apptSvc.updateAppointment(cita.id, { status: 'canceled' })
      .then(() => {
        this.mensaje = '❌ Cita cancelada correctamente.';
        this.horaSeleccionada = '';
        this.loadCitas();
      });
  }

  /** Devuelve la cita pending que coincida con fechaSeleccionada/horaSeleccionada */
  findPending(): Appointment | undefined {
    return this.citas.find(c =>
      c.status === 'pending' && this.matches(c, this.horaSeleccionada)
    );
  }

  /** Comprueba si un Appointment coincide con la fecha/hora dadas */
  private matches(c: Appointment, hora: string): boolean {
    const dt = new Date(c.datetime);
    const dateStr = dt.toISOString().split('T')[0];
    const timeStr = dt.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
    return dateStr === this.fechaSeleccionada && timeStr === hora;
  }

  /** Convierte '08:00 AM' a '08:00' */
  to24h(hora12: string): string {
    const [time, meridian] = hora12.split(' ');
    let [h, m] = time.split(':').map(n => +n);
    if (meridian === 'PM' && h < 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  }

  canCancel(): boolean {
    return !!this.findPending();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
