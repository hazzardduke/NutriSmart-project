import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AppointmentsService, Appointment } from '../../services/appointments.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  fechaSeleccionada = '';
  today = ''; // Fecha mínima permitida
  horaSeleccionada = '';
  showPopup = false;
  popupMessage = '';
  citasTodas: Appointment[] = [];
  citasUsuario: Appointment[] = [];
  private uid = '';
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
    private apptService: AppointmentsService
  ) {}

  ngOnInit(): void {
    this.today = this.getToday();
    this.fechaSeleccionada = this.today;
    this.onFechaChange();

    this.subs.add(
      this.authService.user$.subscribe((user: any | null) => {
        if (user) {
          this.uid = user.uid;
          this.loadCitasDeUsuario();
        } else {
          this.citasUsuario = [];
        }
      })
    );

    this.subs.add(
      this.apptService.getAllAppointments()
        .subscribe((apps: Appointment[]) => {
          this.citasTodas = apps;
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  public getToday(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }

  private loadCitasDeUsuario(): void {
    if (!this.uid) {
      this.citasUsuario = [];
      return;
    }
    this.subs.add(
      this.apptService.getUserAppointments(this.uid)
        .subscribe((listUsr: Appointment[]) => {
          this.citasUsuario = listUsr.sort((a, b) => {
            const pa = a.status === 'confirmed' ? 0 : 1;
            const pb = b.status === 'confirmed' ? 0 : 1;
            if (pa !== pb) return pa - pb;
            return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
          });
        })
    );
  }

  get citasDeHoy(): Appointment[] {
    const today = this.getToday();
    return this.citasUsuario.filter(c =>
      c.status === 'confirmed' && c.datetime.startsWith(today)
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

    const hoy = new Date();
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const hoy0 = new Date(`${hoy.toISOString().split('T')[0]}T00:00:00`);

    if (sel > hoy) {
      this.todosHorasPasaron = false;
      return;
    }

    if (sel < hoy0) {
      this.todosHorasPasaron = true;
      return;
    }

    const mn = hoy.getHours() * 60 + hoy.getMinutes();
    this.todosHorasPasaron = !this.horarios.some(horario => this.horaEnMinutos(horario) > mn);
  }

  isHorarioDisponible(horario: string): boolean {
    if (!this.fechaSeleccionada) return false;

    const now = new Date();
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const mn = now.getHours() * 60 + now.getMinutes();

    if (this.esHoy(sel) && this.horaEnMinutos(horario) <= mn) return false;

    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(horario)}:00`).toISOString();
    if (this.enEdicion && this.citaEnEdicion?.datetime === iso) return true;

    return !this.citasTodas.some(c => c.datetime === iso && c.status !== 'canceled');
  }

  private esHoy(f: Date): boolean {
    const hoy = new Date();
    return f.getFullYear() === hoy.getFullYear() &&
           f.getMonth() === hoy.getMonth() &&
           f.getDate() === hoy.getDate();
  }

  private horaEnMinutos(h12: string): number {
    const [time, mer] = h12.split(' ');
    let [h, m] = time.split(':').map(n => +n);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  private findPendingEnForm(): Appointment | undefined {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) return;
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();
    return this.citasTodas.find(c => c.status === 'confirmed' && c.datetime === iso);
  }

  puedeEditar(c: Appointment): boolean {
    return c.status === 'confirmed';
  }

  editarCita(c: Appointment): void {
    this.enEdicion = true;
    this.citaEnEdicion = c;
    const dt = new Date(c.datetime);
    this.fechaSeleccionada = dt.toISOString().split('T')[0];
    this.horaSeleccionada = this.formateaHora(c.datetime);
    this.displayPopup(`🖊️ Editando cita para ${this.formateaFecha(c.datetime)} a las ${this.horaSeleccionada}.`);
    this.verificarSiHorasPasaron();
  }

  cancelarEdicion(): void {
    this.enEdicion = false;
    this.citaEnEdicion = undefined;
    this.fechaSeleccionada = this.today;
    this.horaSeleccionada = '';
    this.verificarSiHorasPasaron();
  }

  guardarCita(): void {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) return;
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();

    if (this.enEdicion && this.citaEnEdicion?.id) {
      this.apptService.updateAppointment(this.citaEnEdicion.id, { datetime: iso })
        .then(() => {
          this.displayPopup(`✅ Cita reprogramada a ${this.formateaFecha(iso)} – ${this.horaSeleccionada}.`);
          this.cancelarEdicion();
          this.loadCitasDeUsuario();
        })
        .catch(() => this.displayPopup('🚨 Error al actualizar la cita.'));
    } else {
      this.apptService.createAppointment({ userId: this.uid, datetime: iso, status: 'confirmed' })
        .then(() => {
          this.displayPopup('✅ Cita confirmada con éxito.');
          this.fechaSeleccionada = this.today;
          this.horaSeleccionada = '';
          this.loadCitasDeUsuario();
        })
        .catch(() => this.displayPopup('🚨 Error al crear la cita.'));
    }
  }

  cancelarCitaEspecifica(c: Appointment): void {
    if (!c.id) return;
    this.apptService.updateAppointment(c.id, { status: 'canceled' })
      .then(() => {
        this.displayPopup(`❌ Cita del ${this.formateaFecha(c.datetime)} a las ${this.formateaHora(c.datetime)} cancelada.`);
        this.loadCitasDeUsuario();
      })
      .catch(() => this.displayPopup('🚨 Error al cancelar la cita.'));
  }

  private displayPopup(msg: string): void {
    this.popupMessage = msg;
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 8000);
  }

  private to24h(h12: string): string {
    const [time, mer] = h12.split(' ');
    let [h, m] = time.split(':').map(n => +n);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  formateaFecha(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  formateaHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  }
}
