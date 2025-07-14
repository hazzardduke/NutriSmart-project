// src/app/features/nutri-schedule/nutri-schedule.component.ts
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
import { Subscription } from 'rxjs';

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
  imports: [
    CommonModule,
    FormsModule,
    NgIf,
    NgForOf,
    NgClass,
    FullCalendarModule
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './nutri-schedule.component.html',
  styleUrls: ['./nutri-schedule.component.scss']
})
export class NutriScheduleComponent implements OnInit, OnDestroy {
  activeTab: 'new' | 'calendar' | 'history' = 'new';
  clients: ClientProfile[] = [];
  selectedClientId = '';
  today = '';
  fechaSeleccionada = '';
  horaSeleccionada = '';
  editingId: string | null = null;

  filterDate = '';
  allCitas: Appointment[] = [];
  citas: Appointment[] = [];
  canceledCitas: Appointment[] = [];
  completedCitas: Appointment[] = [];

  private subs = new Subscription();

  modalVisible = false;
  modalMessage = '';
  modalType: 'info' | 'confirm' = 'info';
  private modalCallback: ((result: boolean) => void) | null = null;

  horarios = [
    '08:00 AM','09:00 AM','10:00 AM','11:00 AM',
    '01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM',
  ];

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
    eventDidMount: this.renderEventButtons.bind(this),
    eventClick: this.handleEventClick.bind(this),
    events: [],
    dateClick: this.onDateClick.bind(this),
  };

  constructor(
    private profileService: ProfileService,
    private apptService: AppointmentsService,
    private emailService: EmailService
  ) {}

  ngOnInit(): void {
    this.today = this.getToday();
    this.fechaSeleccionada = this.today;
    this.calendarOptions = { ...this.calendarOptions, validRange: { start: this.today } };

    this.subs.add(
      this.profileService.getClients().subscribe(list => this.clients = list)
    );

    this.subs.add(
      this.apptService.getAllAppointments().subscribe(apps => {
        const now = Date.now();
        apps.forEach(c => {
          const startMs = new Date(c.datetime).getTime();
          if (c.status === 'confirmed' && startMs + 3600000 < now) {
            this.apptService.updateAppointment(c.id!, { status: 'completed' });
          }
        });
        this.allCitas       = apps;
        this.citas          = apps.filter(c => c.status === 'confirmed');
        this.canceledCitas  = apps.filter(c => c.status === 'canceled');
        this.completedCitas = apps.filter(c => c.status === 'completed');
        this.loadCalendarEvents();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadCalendarEvents(): void {
    const eventos: EventInput[] = this.allCitas
      .filter(c => c.status === 'confirmed' || c.status === 'completed')
      .map(c => ({
        id: c.id!,
        title: this.getClientName(c.userId),
        start: new Date(c.datetime),
        end: new Date(new Date(c.datetime).getTime() + 3600000),
        extendedProps: { status: c.status }
      }));
    this.calendarOptions = { ...this.calendarOptions, events: eventos };
  }

  private renderEventButtons(arg: any) {
    if (arg.event.extendedProps.status === 'completed') return;
    const el = arg.el as HTMLElement;

    const btnEdit = document.createElement('img');
    btnEdit.src = 'assets/icons/edit-icon.png';
    btnEdit.alt = 'Editar';
    btnEdit.title = 'Editar';
    btnEdit.classList.add('event-btn-icon');
    btnEdit.addEventListener('click', ev => { ev.stopPropagation(); this.startEdit(arg.event.id!); });

    const btnCancel = document.createElement('img');
    btnCancel.src = 'assets/icons/cancel-icon.png';
    btnCancel.alt = 'Cancelar';
    btnCancel.title = 'Cancelar';
    btnCancel.classList.add('event-btn-icon');
    btnCancel.addEventListener('click', ev => { ev.stopPropagation(); this.cancelAppointment(arg.event.id!); });

    el.querySelector('.fc-event-title')?.append(btnEdit, btnCancel);
  }

  private handleEventClick(_: any) {}

  scheduleCita(): void {
    if (!this.selectedClientId || !this.fechaSeleccionada || !this.horaSeleccionada) return;
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();
    const cliente = this.clients.find(c => c.id === this.selectedClientId)!;

    const mailData: CitaMailData = {
      nombre: cliente.nombre,
      fecha: this.formatFullDate(iso),
      hora: this.formateaHora(iso),
      ubicacion: 'Clínica NutriSmart',
      urlCita: `https://nutrismart.com/citas/${this.editingId ?? ''}`
    };

    if (this.editingId) {
      this.showModal('¿Actualizar cita?', 'confirm').then(ok => {
        if (!ok) return;
        this.apptService.updateAppointment(this.editingId!, { userId: this.selectedClientId, datetime: iso })
          .then(() => this.emailService.sendCitaActualizada(cliente.correo, mailData))
          .then(() => { this.showModal('La cita ha sido Actualizada','info'); this.finishEdit(); });
      });
    } else {
      this.apptService.createAppointment({ userId: this.selectedClientId, datetime: iso, status: 'confirmed' })
        .then(() => this.emailService.sendCitaConfirmada(cliente.correo, mailData))
        .then(() => { this.showModal('La cita ha sido Creada','info'); this.finishEdit(); });
    }
  }

  private cancelAppointment(id: string) {
    this.showModal('¿Cancelar cita?', 'confirm').then(ok => {
      if (!ok) return;
      const appt = this.allCitas.find(c => c.id === id)!;
      const cliente = this.clients.find(c => c.id === appt.userId)!;
      const mailData: CitaMailData = {
        nombre: cliente.nombre,
        fecha: this.formatFullDate(appt.datetime),
        hora: this.formateaHora(appt.datetime),
        ubicacion: 'Clínica NutriSmart'
      };
      this.apptService.updateAppointment(id, { status: 'canceled' })
        .then(() => this.emailService.sendCitaCancelada(cliente.correo, mailData))
        .then(() => { this.showModal('La cita ha sido Cancelada','info'); this.loadCalendarEvents(); });
    });
  }

  private startEdit(id: string) {
    const appt = this.citas.find(c => c.id === id)!;
    this.editingId = id;
    this.selectedClientId = appt.userId;
    [this.fechaSeleccionada] = appt.datetime.split('T');
    const d = new Date(appt.datetime),
          h24 = d.getHours(), m = String(d.getMinutes()).padStart(2,'0'),
          ampm = h24 >= 12 ? 'PM' : 'AM', h12 = h24 % 12 || 12;
    this.horaSeleccionada = `${String(h12).padStart(2,'0')}:${m} ${ampm}`;
    this.showModal('¿Editar cita?', 'confirm').then(ok => { if (ok) this.activeTab = 'new'; });
  }

  private finishEdit() {
    this.editingId = null;
    this.selectedClientId = '';
    this.fechaSeleccionada = this.today;
    this.horaSeleccionada = '';
    this.loadCalendarEvents();
  }

  onDateClick(_: any) { this.activeTab = 'history'; }

  public get filteredHistoryAppointments(): Appointment[] {
    return this.allCitas
      .filter(c => c.status === 'canceled' || c.status === 'completed')
      .filter(c => !this.filterDate || c.datetime.startsWith(this.filterDate))
      .sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }

  public getToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  onDateChange(): void { this.horaSeleccionada = ''; }

  private to24h(h12: string): string {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(n => +n);
    if (mer==='PM' && h<12) h+=12;
    if (mer==='AM' && h===12) h=0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  public isHorarioDisponible(h: string): boolean {
    if (!this.fechaSeleccionada) return false;
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const now = new Date();
    if (this.esHoy(sel) && this.horaEnMinutos(h) <= now.getHours()*60 + now.getMinutes()) {
      return false;
    }
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(h)}:00`).toISOString();
    return !this.allCitas.some(c => c.datetime === iso && c.status === 'confirmed');
  }

  private horaEnMinutos(h12: string): number {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(n => +n);
    if (mer==='PM' && h<12) h+=12;
    if (mer==='AM' && h===12) h=0;
    return h*60 + m;
  }

  private esHoy(d: Date): boolean {
    const n = new Date();
    return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
  }

  formateaHora(iso: string): string {
    const d = new Date(iso);
    const h24 = d.getHours(), min = String(d.getMinutes()).padStart(2,'0');
    const ampm = h24>=12?'PM':'AM', h12 = h24%12||12;
    return `${String(h12).padStart(2,'0')}:${min} ${ampm}`;
  }

  formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' });
  }

  getClientName(uid: string): string {
    const c = this.clients.find(x => x.id===uid);
    return c ? `${c.nombre} ${c.apellido}` : uid;
  }

  showModal(message: string, type: 'info'|'confirm'): Promise<boolean> {
    this.modalMessage = message;
    this.modalType    = type;
    this.modalVisible = true;
    return new Promise(resolve => this.modalCallback = resolve);
  }

  modalResponse(result: boolean): void {
    this.modalVisible = false;
    if (this.modalCallback) { this.modalCallback(result); this.modalCallback = null; }
  }
}
