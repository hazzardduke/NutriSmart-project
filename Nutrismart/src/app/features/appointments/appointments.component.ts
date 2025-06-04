// src/app/core/appointments/appointments.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf }            from '@angular/common';
import { FormsModule }                   from '@angular/forms';
import { Subscription }                  from 'rxjs';
import { AuthService }                   from '../../services/auth.service';
import {
  AppointmentsService,
  Appointment
} from '../../services/appointments.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  /** VARIABLES PARA EL FORMULARIO */
  fechaSeleccionada = '';
  horaSeleccionada  = '';

  /** TODAS LAS CITAS QUE EXISTEN EN FIRESTORE (cualquier usuario) */
  citasTodas: Appointment[] = [];

  /** SOLO LAS CITAS DE ESTE USUARIO (para “Mis Citas”) */
  citasUsuario: Appointment[] = [];

  mensaje = '';
  private uid = '';
  private subs = new Subscription();

  /** Horarios disponibles (estáticos) */
  horarios = [
    '08:00 AM', '09:00 AM', '10:00 AM',
    '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'
  ];

  /** VARIABLES PARA EDICIÓN/REPROGRAMACIÓN */
  enEdicion       = false;
  citaEnEdicion?: Appointment;
  horaOriginal    = '';
  fechaOriginal   = '';

  /** Flag: si TODOS los slots de la fecha ya pasaron */
  todosHorasPasaron = false;

  constructor(
    private auth: AuthService,
    private apptSvc: AppointmentsService
  ) {}

  ngOnInit(): void {
    // 1) Suscríbete a user$ para cargar “mis citas”
    this.subs.add(
      this.auth.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.loadCitasDeUsuario();
        } else {
          this.uid = '';
          this.citasUsuario = [];
        }
      })
    );
  
    // 2) Suscríbete a TODAS las citas para calcular disponibilidad global
    this.subs.add(
      this.apptSvc.getAllAppointments()
        .subscribe(list => {
          this.citasTodas = list;
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // =================================================
  //   Carga únicamente las citas de ESTE usuario
  // =================================================
  private loadCitasDeUsuario() {
    if (!this.uid) {
      this.citasUsuario = [];
      return;
    }
    this.subs.add(
      this.apptSvc.getUserAppointments(this.uid)
        .subscribe(listUsr => {
          this.citasUsuario = listUsr;
        })
    );
  }

  // =================================================
  //   Cada vez que cambia el <input type="date">
  // =================================================
  onFechaChange() {
    this.horaSeleccionada = '';
    this.enEdicion = false;
    this.citaEnEdicion = undefined;
    this.horaOriginal = '';
    this.fechaOriginal = '';
    this.mensaje = '';
    this.verificarSiHorasPasaron();
  }

  private verificarSiHorasPasaron() {
    if (!this.fechaSeleccionada) {
      this.todosHorasPasaron = false;
      return;
    }
    const hoy = new Date();
    const selectedDate = new Date(this.fechaSeleccionada + 'T00:00:00');

    // Si la fecha es > hoy, queda al menos un slot futuro
    if (selectedDate > hoy) {
      this.todosHorasPasaron = false;
      return;
    }
    // Si la fecha es < hoy (cualquier momento), todos los slots ya pasaron
    const hoySinHora = new Date(hoy.toISOString().split('T')[0] + 'T00:00:00');
    if (selectedDate < hoySinHora) {
      this.todosHorasPasaron = true;
      return;
    }
    // Si la fecha es exactamente hoy, chequeamos qué horas quedan
    const ahoraMin = hoy.getHours() * 60 + hoy.getMinutes();
    const haySlotFuturo = this.horarios.some(h => this.horaEnMinutos(h) > ahoraMin);
    this.todosHorasPasaron = !haySlotFuturo;
  }

  /**
   * isHorarioDisponible(h: string):
   *   1) Bloquea slots ≤ hora actual si la fechaSelected es HOY.
   *   2) Construye iso "fechaSeleccionada + h".
   *   3) Si estamos editando y coincide con la citaEnEdicion, LO PERMITE.
   *   4) Si NO estamos editando y ese iso pertenece a una cita “pending” propia, LO PERMITE (para poder cancelar/editar).
   *   5) Si existe YA cualquier cita “pending” (de cualquier usuario) con ese iso, lo bloquea.
   *   6) Si pasa todo lo anterior, lo habilita.
   */
  public isHorarioDisponible(h: string): boolean {
    if (!this.fechaSeleccionada) return false;
  
    // 1) Bloquear horas pasadas si la fecha es hoy
    const ahora = new Date();
    const selectedDate = new Date(this.fechaSeleccionada + 'T00:00:00');
    if (this.esHoy(selectedDate)) {
      const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
      const slotMin = this.horaEnMinutos(h);
      if (slotMin <= ahoraMin) {
        return false;
      }
    }
  
    // 2) Construir el ISO string candidate
    const isoCandidato = new Date(
      `${this.fechaSeleccionada}T${this.to24h(h)}:00`
    ).toISOString();
  
    // 3) Si estamos editando y coincide con la cita que ya estoy editando, permitir
    if (
      this.enEdicion &&
      this.citaEnEdicion &&
      this.citaEnEdicion.datetime === isoCandidato
    ) {
      return true;
    }
  
    // 4) BLOQUEO: si existe alguna cita en citasTodas con mismo datetime y status != 'canceled'
    const existeConflict = this.citasTodas.some(c =>
      c.datetime === isoCandidato && c.status !== 'canceled'
    );
    if (existeConflict) {
      return false;
    }
  
    // 5) Si pasa las pruebas, LO PERMITO
    return true;
  }
  

  private esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return (
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth()    === hoy.getMonth() &&
      fecha.getDate()     === hoy.getDate()
    );
  }

  /** '08:00 AM' → minutos desde medianoche (p.ej. 480) */
  private horaEnMinutos(hora12: string): number {
    const [time, meridian] = hora12.split(' ');
    let [h, m] = time.split(':').map(n => +n);
    if (meridian === 'PM' && h < 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  /**
   * Buscar en citasTodas una cita “pending” que coincida
   * exactamente con fechaSeleccionada + horaSeleccionada.
   * Si falta fecha u hora, devuelve undefined de inmediato.
   */
  private findPendingEnForm(): Appointment | undefined {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      return undefined;
    }
    const isoCandidato = new Date(
      `${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`
    ).toISOString();
    return this.citasTodas.find(c =>
      c.status === 'confirmed' && c.datetime === isoCandidato
    );
  }

  /** Expuesto al template para *ngIf="canCancel()" */
  public canCancel(): boolean {
    // Si no hay fecha/hora seleccionadas, devolvemos false
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      return false;
    }
    return !!this.findPendingEnForm();
  }

  // ==================================================================================
  //   Mostrar botones “Editar” / “Cancelar” en la tabla de “Mis Citas”
  //   ⇨ Solo chequeamos si está “pending” (ya no >24h).
  // ==================================================================================
  public puedeEditar(cita: Appointment): boolean {
    return cita.status === 'confirmed';
  }

  /**
   * Cargar la cita en el formulario y activar MODO EDICIÓN.
   */
  public editarCita(cita: Appointment) {
    this.enEdicion     = true;
    this.citaEnEdicion = cita;

    const dt = new Date(cita.datetime);
    this.fechaSeleccionada = dt.toISOString().split('T')[0];
    this.horaSeleccionada  = this.formateaHora(cita.datetime);

    this.horaOriginal  = this.horaSeleccionada;
    this.fechaOriginal = this.fechaSeleccionada;
    this.mensaje = `🖊️ Editando cita para ${this.formateaFecha(cita.datetime)} a las ${this.horaSeleccionada}.`;
    this.verificarSiHorasPasaron();
  }

  /** Cancelar modo edición sin persistir cambios. */
  public cancelarEdicion() {
    this.enEdicion         = false;
    this.citaEnEdicion     = undefined;
    this.horaOriginal      = '';
    this.fechaOriginal     = '';
    this.fechaSeleccionada = '';
    this.horaSeleccionada  = '';
    this.mensaje           = '';
    this.todosHorasPasaron = false;
  }

  // ==================================================================================
  //   Crear o Actualizar cita en Firestore
  // ==================================================================================
  public guardarCita() {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) return;
  
    const isoSlot = new Date(
      `${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`
    ).toISOString();
  
    if (this.enEdicion && this.citaEnEdicion?.id) {
      // MODO EDICIÓN: reprogramar la cita existente
      this.apptSvc.updateAppointment(this.citaEnEdicion.id, { datetime: isoSlot })
        .then(() => {
          this.mensaje = `✅ Cita reprogramada a ${this.formateaFecha(isoSlot)} – ${this.horaSeleccionada}.`;
          this.cancelarEdicion();
          this.loadCitasDeUsuario();
        })
        .catch(err => {
          this.mensaje = '🚨 Error al actualizar la cita.';
          console.error(err);
        });
    }
    else {
      // MODO CREACIÓN: grabo la cita con estado 'confirmed' de inmediato
      this.apptSvc.createAppointment({
        userId: this.uid,
        datetime: isoSlot,
        status: 'confirmed'
      })
      .then(() => {
        this.mensaje = '✅ Cita confirmada con éxito.';
        this.fechaSeleccionada = '';
        this.horaSeleccionada  = '';
        this.loadCitasDeUsuario();
      })
      .catch(err => {
        this.mensaje = '🚨 Error al crear la cita.';
        console.error(err);
      });
    }
  }
  

  // ==================================================================================
  //   Cancelar cita desde FORMULARIO (cuando *ngIf="canCancel()")
  // ==================================================================================
  public cancelarCita() {
    const cita = this.findPendingEnForm();
    if (!cita?.id) {
      return;
    }
    this.apptSvc.updateAppointment(cita.id, { status: 'canceled' })
      .then(() => {
        this.mensaje = '❌ Cita cancelada correctamente.';
        this.horaSeleccionada = '';
        this.loadCitasDeUsuario();
      })
      .catch(err => {
        this.mensaje = '🚨 Error al cancelar la cita.';
        console.error(err);
      });
  }

  // ==================================================================================
  //   Cancelar cita desde la TABLA de “Mis Citas”
  // ==================================================================================
  public cancelarCitaEspecifica(cita: Appointment) {
    if (!cita.id) {
      return;
    }
    this.apptSvc.updateAppointment(cita.id, { status: 'canceled' })
      .then(() => {
        this.mensaje = `❌ Cita del ${this.formateaFecha(cita.datetime)} a las ${this.formateaHora(cita.datetime)} cancelada.`;
        this.loadCitasDeUsuario();
      })
      .catch(err => {
        this.mensaje = '🚨 Error al cancelar la cita.';
        console.error(err);
      });
  }

  // ==================================================================================
  //   UTILITARIOS DE FORMATO
  // ==================================================================================
  /** '08:00 AM' → '08:00' (24h) */
  private to24h(hora12: string): string {
    const [time, meridian] = hora12.split(' ');
    let [h, m] = time.split(':').map(n => +n);
    if (meridian === 'PM' && h < 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  }

  /** 'YYYY-MM-DDTHH:mm:ss.sssZ' → 'DD/MM/YYYY' */
  public formateaFecha(isoStr: string): string {
    const dt = new Date(isoStr);
    const d = dt.getDate().toString().padStart(2,'0');
    const m = (dt.getMonth()+1).toString().padStart(2,'0');
    const y = dt.getFullYear();
    return `${d}/${m}/${y}`;
  }

  /** 'YYYY-MM-DDTHH:mm:ss.sssZ' → 'HH:MM AM/PM' */
  public formateaHora(isoStr: string): string {
    const dt = new Date(isoStr);
    return dt.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
