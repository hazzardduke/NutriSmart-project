// src/app/features/nutri-schedule/nutri-schedule.component.ts
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgIf, NgForOf }  from '@angular/common';
import { FormsModule }                  from '@angular/forms';
import { Subscription }                 from 'rxjs';

import { ProfileService, ClientProfile }     from '../../services/profile.service';
import { AppointmentsService, Appointment } from '../../services/appointments.service';

import { FullCalendarModule }           from '@fullcalendar/angular';
import timeGridPlugin                    from '@fullcalendar/timegrid';
import interactionPlugin                 from '@fullcalendar/interaction';
import esLocale                          from '@fullcalendar/core/locales/es';
import { CalendarOptions, EventInput }   from '@fullcalendar/core';

@Component({
  selector: 'app-nutri-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIf,
    NgForOf,
    FullCalendarModule
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './nutri-schedule.component.html',
  styleUrls: ['./nutri-schedule.component.scss']
})
export class NutriScheduleComponent implements OnInit, OnDestroy {
  /** Pestaña activa: 'new' o 'history' */
  activeTab: 'new' | 'history' = 'new';

  // Datos para formulario de citas
  clients: ClientProfile[] = [];
  selectedClientId = '';
  today = '';
  fechaSeleccionada = '';
  horaSeleccionada = '';
  editingId: string | null = null;

  // Horarios disponibles
  horarios: string[] = [
    '08:00 AM','09:00 AM','10:00 AM',
    '11:00 AM','01:00 PM','02:00 PM',
    '03:00 PM','04:00 PM','05:00 PM'
  ];

  // Datos de calendario
  historyDate = '';
  citas: Appointment[] = [];
  private subs = new Subscription();

  // Opciones de FullCalendar
  calendarOptions: CalendarOptions = {
    plugins:          [ timeGridPlugin, interactionPlugin ],
    locale:           'es',
    locales:          [ esLocale ],
    initialView:      'timeGridDay',
    headerToolbar:    { left: 'prev,next today', center: 'title', right: '' },
    timeZone:         'local',
    validRange:       { start: '' },
    allDaySlot:       false,
    slotMinTime:      '08:00:00',
    slotMaxTime:      '18:00:00',
    slotDuration:     '00:30:00',
    slotLabelFormat:  { hour: 'numeric', minute: '2-digit', hour12: true },
    eventTimeFormat:  { hour: 'numeric', minute: '2-digit', hour12: true },
    eventDidMount:    this.renderEventButtons.bind(this),
    eventClick:       this.handleEventClick.bind(this),
    events:           [],
    dateClick:        this.onDateClick.bind(this)
  };

  constructor(
    private profileService: ProfileService,
    private apptService:    AppointmentsService
  ) {}

  ngOnInit(): void {
    // Inicializa fechas
    this.today = this.getToday();
    this.fechaSeleccionada = this.today;
    this.historyDate = this.today;

    // Bloquea navegación a días anteriores
    this.calendarOptions = {
      ...this.calendarOptions,
      validRange: { start: this.today }
    };

    // Carga lista de clientes
    this.subs.add(
      this.profileService.getClients()
        .subscribe(list => this.clients = list)
    );

    // Carga citas confirmadas
    this.subs.add(
      this.apptService.getAllAppointments()
        .subscribe(apps => {
          this.citas = apps.filter(c => c.status === 'confirmed');
          this.loadCalendarEvents();
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Genera eventos del calendario con id */
  private loadCalendarEvents(): void {
    const eventos: EventInput[] = this.citas.map(c => ({
      id:     c.id!,
      title:  this.getClientName(c.userId),
      start:  new Date(c.datetime),
      end:    new Date(new Date(c.datetime).getTime() + 60 * 60000),
      allDay: false
    }));
    this.calendarOptions = { ...this.calendarOptions, events: eventos };
  }

  /** Inyecta botones Editar/Cancelar en cada evento */
  private renderEventButtons(arg: any) {
    const el = arg.el as HTMLElement;

    const btnEdit = document.createElement('button');
    btnEdit.innerText = '✏️';
    btnEdit.title = 'Editar';
    btnEdit.classList.add('event-btn');
    btnEdit.addEventListener('click', ev => {
      ev.stopPropagation();
      this.startEdit(arg.event.id!);
    });

    const btnCancel = document.createElement('button');
    btnCancel.innerText = '❌';
    btnCancel.title = 'Cancelar';
    btnCancel.classList.add('event-btn');
    btnCancel.addEventListener('click', ev => {
      ev.stopPropagation();
      this.cancelAppointment(arg.event.id!);
    });

    const titleEl = el.querySelector('.fc-event-title');
    if (titleEl) titleEl.append(btnEdit, btnCancel);
  }

  /** Maneja click en evento (fuera de botones) */
  private handleEventClick(arg: any) {
    console.log('Evento clic:', arg.event.id);
  }

  /** Prepara formulario para editar una cita */
  private startEdit(id: string) {
    const appt = this.citas.find(c => c.id === id);
    if (!appt) return;

    this.editingId = id;
    this.selectedClientId = appt.userId;
    const [date,] = appt.datetime.split('T');
    this.fechaSeleccionada = date;

    const d = new Date(appt.datetime);
    const h24 = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    this.horaSeleccionada = `${String(h12).padStart(2, '0')}:${m} ${ampm}`;

    // Confirmar antes de cambiar de pestaña
    if (confirm('¿Ir al formulario para editar esta cita?')) {
      this.activeTab = 'new';
    }
  }

  /** Crea o actualiza cita, pide confirmación antes de actualizar */
  scheduleCita(): void {
    if (!this.selectedClientId || !this.fechaSeleccionada || !this.horaSeleccionada) return;

    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();

    if (this.editingId) {
      if (!confirm('¿Seguro que deseas actualizar esta cita?')) return;
      this.apptService.updateAppointment(this.editingId, { userId: this.selectedClientId, datetime: iso })
        .then(() => alert('Cita actualizada ✅'))
        .finally(() => this.finishEdit());
    } else {
      this.apptService.createAppointment({ userId: this.selectedClientId, datetime: iso, status: 'confirmed' })
        .then(() => alert('Cita creada ✅'))
        .finally(() => this.finishEdit());
    }
  }

  /** Resetea formulario y recarga calendario */
  private finishEdit() {
    this.editingId = null;
    this.selectedClientId = '';
    this.fechaSeleccionada = this.today;
    this.horaSeleccionada = '';
    this.loadCalendarEvents();
  }

  /** Cancela cita con confirmación */
  private cancelAppointment(id: string) {
    if (!confirm('¿Cancelar esta cita?')) return;
    this.apptService.updateAppointment(id, { status: 'canceled' })
      .then(() => { alert('Cita cancelada'); this.loadCalendarEvents(); });
  }

  /** Al hacer click en calendario: actualiza historyDate */
  private onDateClick(arg: any): void {
    this.historyDate = arg.dateStr;
  }

  /** Citas filtradas por fecha seleccionada */
  get citasPorDia(): Appointment[] {
    return this.citas.filter(c => c.datetime.startsWith(this.historyDate));
  }

  /** Verifica si un horario está disponible */
  isHorarioDisponible(h: string): boolean {
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const now = new Date();
    const mn = now.getHours() * 60 + now.getMinutes();
    if (this.esHoy(sel) && this.horaEnMinutos(h) <= mn) return false;
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(h)}:00`).toISOString();
    return !this.citas.some(c => c.datetime === iso);
  }

  /** Helpers de fecha y hora */
  public getToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  onDateChange(): void { this.horaSeleccionada = ''; }

  private to24h(h12: string): string {
    const [t, mer] = h12.split(' ');
    let [h, m]     = t.split(':').map(n => +n);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  private horaEnMinutos(h12: string): number {
    const [t, mer] = h12.split(' ');
    let [h, m]     = t.split(':').map(n => +n);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return h*60 + m;
  }

  private esHoy(d: Date): boolean {
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  formateaHora(iso: string): string {
    const d = new Date(iso);
    const h24 = d.getHours();
    const min = String(d.getMinutes()).padStart(2,'0');
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${min} ${ampm}`;
  }

  formatFullDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES',{ day: 'numeric', month: 'long', year: 'numeric' });
  }

  getClientName(uid: string): string {
    const c = this.clients.find(x => x.id === uid);
    return c ? `${c.nombre} ${c.apellido}` : uid;
  }
}