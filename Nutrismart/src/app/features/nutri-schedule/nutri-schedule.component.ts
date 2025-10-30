import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import {
  CommonModule,
  NgIf,
  NgForOf,
  NgClass
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import Swal from 'sweetalert2';

import { ProfileService, ClientProfile } from '../../services/profile.service';
import { AppointmentsService, Appointment } from '../../services/appointments.service';
import { EmailService, CitaMailData } from '../../services/email.service';

import { FullCalendarModule } from '@fullcalendar/angular';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CalendarOptions, EventInput } from '@fullcalendar/core';

@Component({
  selector: 'app-nutri-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgForOf, NgClass, FullCalendarModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './nutri-schedule.component.html',
  styleUrls: ['./nutri-schedule.component.scss']
})
export class NutriScheduleComponent implements OnInit, OnDestroy {
  activeTab: 'new' | 'calendar' | 'history' = 'new';
  historyClientId = '';
  clients: ClientProfile[] = [];
  selectedClientId = '';
  editingId: string | null = null;
  allCitas: Appointment[] = [];
  citas: Appointment[] = [];
  canceledCitas: Appointment[] = [];
  completedCitas: Appointment[] = [];
  today = '';
  fechaSeleccionada = '';
  horaSeleccionada = '';
  horarios = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];
  private subs = new Subscription();

  itemsPerPage = 6;
  currentPage = 1;
  totalPages = 1;
  paginatedHistory: Appointment[] = [];

  constructor(
    private profileService: ProfileService,
    private apptService: AppointmentsService,
    private emailService: EmailService
  ) {}

  ngOnInit(): void {
    this.today = this.getToday();
    this.fechaSeleccionada = this.today;
    this.calendarOptions.validRange = { start: this.today };

    const clients$ = this.profileService.getClients();
    const apps$ = this.apptService.getAllAppointments();

    this.subs.add(
      combineLatest([clients$, apps$]).subscribe(([clients, apps]) => {
        this.clients = clients;
        const now = Date.now();

        apps.forEach(c => {
          const startMs = new Date(c.datetime).getTime();
          if (c.status === 'confirmed' && startMs + 3600000 < now) {
            this.apptService.updateAppointment(c.id!, { status: 'completed' });
          }
        });

        this.allCitas = apps;
        this.citas = apps.filter(c => c.status === 'confirmed');
        this.canceledCitas = apps.filter(c => c.status === 'canceled');
        this.completedCitas = apps.filter(c => c.status === 'completed');

        this.updatePaginatedHistory();
        this.loadCalendarEvents();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.updatePaginatedHistory();
  }

  calendarOptions: CalendarOptions = {
    plugins: [timeGridPlugin, interactionPlugin],
    locale: 'es',
    locales: [esLocale],
    initialView: 'timeGridDay',
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    timeZone: 'local',
    validRange: { start: '' },
    allDaySlot: false,
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    slotDuration: '00:30:00',
    slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: true },
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', hour12: true },
    events: [],
    dateClick: this.onDateClick.bind(this),
    eventContent: this.renderEventContent.bind(this)
  };

  private loadCalendarEvents(): void {
    const eventos: EventInput[] = this.allCitas
      .filter(c => c.status !== 'canceled')
      .map(c => ({
        id: c.id!,
        title: this.getClientName(c.userId),
        start: new Date(c.datetime),
        end: new Date(new Date(c.datetime).getTime() + 3600000),
        extendedProps: { status: c.status }
      }));
    this.calendarOptions.events = eventos;
  }

  private renderEventContent(arg: any): { domNodes: Node[] } {
    const status: string = arg.event.extendedProps?.status || 'confirmed';
    const name: string = arg.event.title || '';
    const container = document.createElement('div');
    container.className = 'fc-event-inner';

    const top = document.createElement('div');
    top.className = 'event-top';

    const pill = document.createElement('span');
    pill.className = `status-pill ${status === 'completed' ? 'status-completed' : 'status-confirmed'}`;
    pill.textContent = status === 'completed' ? 'Completada' : 'Confirmada';

    const title = document.createElement('div');
    title.className = 'event-title';
    title.textContent = name;

    top.appendChild(pill);
    top.appendChild(title);
    container.appendChild(top);

    const actions = document.createElement('div');
    actions.className = 'event-actions';

    if (status !== 'completed') {
      const edit = document.createElement('img');
      edit.src = '/assets/images/edit-icon.png';
      edit.className = 'event-btn-icon';
      edit.alt = 'Editar';
      edit.title = 'Editar cita';
      edit.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.startEdit(arg.event.id!);
      });

      const cancel = document.createElement('img');
      cancel.src = '/assets/images/cancel-icon.png';
      cancel.className = 'event-btn-icon';
      cancel.alt = 'Cancelar';
      cancel.title = 'Cancelar cita';
      cancel.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.cancelAppointment(arg.event.id!);
      });

      actions.appendChild(edit);
      actions.appendChild(cancel);
    }

    container.appendChild(actions);
    return { domNodes: [container] };
  }

  async scheduleCita(): Promise<void> {
    if (!this.selectedClientId || !this.fechaSeleccionada || !this.horaSeleccionada) {
      await Swal.fire('Campos incompletos', 'Por favor selecciona cliente, fecha y hora.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Procesando cita...',
      html: `
        <img src="assets/images/logontg.png" alt="Nutrition To Go" style="width:90px; margin-bottom:10px;">
        <br><b>Por favor espera un momento</b>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();
    const cliente = this.clients.find(c => c.id === this.selectedClientId)!;
    const mailData: CitaMailData = {
      nombre: cliente.nombre,
      fecha: this.formatFullDate(iso),
      hora: this.formateaHora(iso),
      ubicacion: 'Clínica NutriSmart',
      urlCita: `https://nutrismart.com/citas/${this.editingId ?? ''}`
    };

    try {
      if (this.editingId) {
        await this.apptService.updateAppointment(this.editingId, {
          userId: this.selectedClientId,
          datetime: iso
        });
        await this.emailService.sendCitaActualizada(cliente.correo, mailData);
        Swal.close();
        await Swal.fire({
          title: 'Cita actualizada',
          html: `La cita se actualizó correctamente.<br><br> Se envió un correo al cliente con la confirmación.`,
          icon: 'success',
          confirmButtonColor: '#a1c037'
        });
      } else {
        await this.apptService.createAppointment({
          userId: this.selectedClientId,
          datetime: iso,
          status: 'confirmed'
        });
        await this.emailService.sendCitaConfirmada(cliente.correo, mailData);
        Swal.close();
        await Swal.fire({
          title: 'Cita creada',
          html: `La cita se programó exitosamente.<br><br>Se envió un correo al cliente con los detalles.`,
          icon: 'success',
          confirmButtonColor: '#a1c037'
        });
      }
    } catch {
      Swal.close();
      await Swal.fire('Error', 'No se pudo procesar la cita. Intenta de nuevo.', 'error');
    } finally {
      this.finishEdit();
    }
  }

  async cancelAppointment(id: string): Promise<void> {
    const confirm = await Swal.fire({
      title: '¿Cancelar cita?',
      text: 'Esta acción no se puede revertir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#d21d1dff'
    });
    if (!confirm.isConfirmed) return;

    const appt = this.allCitas.find(c => c.id === id)!;
    const cliente = this.clients.find(c => c.id === appt.userId)!;
    const mailData: CitaMailData = {
      nombre: cliente.nombre,
      fecha: this.formatFullDate(appt.datetime),
      hora: this.formateaHora(appt.datetime),
      ubicacion: 'Clínica NutriSmart'
    };

    try {
      await this.apptService.updateAppointment(id, { status: 'canceled' });
      await this.emailService.sendCitaCancelada(cliente.correo, mailData);
      await Swal.fire({
        title: 'Cita cancelada',
        html: `La cita ha sido cancelada correctamente.<br><br>Se envió un correo al cliente notificando la cancelación.`,
        icon: 'info',
        confirmButtonColor: '#a1c037'
      });
      this.loadCalendarEvents();
      this.updatePaginatedHistory();
    } catch {
      await Swal.fire('Error', 'No se pudo cancelar la cita.', 'error');
    }
  }

  async startEdit(id: string): Promise<void> {
    const appt = this.citas.find(c => c.id === id)!;
    this.editingId = id;
    this.selectedClientId = appt.userId;
    [this.fechaSeleccionada] = appt.datetime.split('T');
    const d = new Date(appt.datetime);
    const h24 = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h24 >= 12 ? 'PM' : 'AM', h12 = h24 % 12 || 12;
    this.horaSeleccionada = `${String(h12).padStart(2, '0')}:${m} ${ampm}`;

    const confirm = await Swal.fire({
      title: 'Editar cita',
      text: '¿Deseas modificar esta cita?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, editar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a1c037'
    });
    if (confirm.isConfirmed) this.activeTab = 'new';
    else this.finishEdit();
  }

  finishEdit(): void {
    this.editingId = null;
    this.selectedClientId = '';
    this.fechaSeleccionada = this.today;
    this.horaSeleccionada = '';
    this.updatePaginatedHistory();
    this.loadCalendarEvents();
  }

  updatePaginatedHistory(): void {
    const filtered = this.filteredHistoryAppointments;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedHistory = filtered.slice(start, start + this.itemsPerPage);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedHistory();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedHistory();
    }
  }

  get totalPagesArray(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 10;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const showLeftDots = current > 6;
    const showRightDots = current < total - 5;

    if (!showLeftDots) {
      for (let i = 1; i <= maxVisible - 2; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (!showRightDots) {
      pages.push(1);
      pages.push('...');
      for (let i = total - (maxVisible - 3); i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 3; i <= current + 3; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }

    return pages;
  }

  goToPage(page: number | string): void {
    if (typeof page === 'string') return;
    this.currentPage = page;
    this.updatePaginatedHistory();
  }

  get filteredHistoryAppointments(): Appointment[] {
    return this.allCitas
      .filter(c => c.status === 'canceled' || c.status === 'completed')
      .filter(c => !this.historyClientId || c.userId === this.historyClientId)
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  }

  formateaHora(iso: string): string {
    const d = new Date(iso);
    const h24 = d.getHours(), min = String(d.getMinutes()).padStart(2, '0');
    const ampm = h24 >= 12 ? 'PM' : 'AM', h12 = h24 % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${min} ${ampm}`;
  }

  formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  getClientName(uid: string): string {
    const c = this.clients.find(x => x.id === uid);
    return c ? `${c.nombre} ${c.apellido}` : uid;
  }

  getToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  onDateClick(): void {
    this.activeTab = 'history';
  }

  isHorarioDisponible(h: string): boolean {
    if (!this.fechaSeleccionada) return false;
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const now = new Date();
    if (this.esHoy(sel) && this.horaEnMinutos(h) <= now.getHours() * 60 + now.getMinutes()) return false;
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(h)}:00`).toISOString();
    return !this.allCitas.some(c => c.datetime === iso && c.status === 'confirmed');
  }

  to24h(h12: string): string {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(Number);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  horaEnMinutos(h12: string): number {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(Number);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  esHoy(d: Date): boolean {
    const n = new Date();
    return d.getFullYear() === n.getFullYear() &&
           d.getMonth() === n.getMonth() &&
           d.getDate() === n.getDate();
  }

  onDateChange(): void {
    this.horaSeleccionada = '';
  }
}
