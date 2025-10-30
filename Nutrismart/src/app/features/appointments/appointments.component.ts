import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { AppointmentsService, Appointment } from '../../services/appointments.service';
import { EmailService } from '../../services/email.service';
import { ProfileService } from '../../services/profile.service';

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
  citasTodas: Appointment[] = [];
  citasUsuario: Appointment[] = [];
  private uid = '';
  private userEmail = '';
  private userName = '';
  private subs = new Subscription();

  horarios = [
    '08:00 AM', '09:00 AM', '10:00 AM',
    '11:00 AM', '01:00 PM', '02:00 PM',
    '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  enEdicion = false;
  citaEnEdicion?: Appointment;
  todosHorasPasaron = false;

  paginaActual = 1;
  citasPorPagina = 5;
  tamañoBloque = 10;

  constructor(
    private authService: AuthService,
    private apptService: AppointmentsService,
    private emailService: EmailService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.today = this.getToday();
    this.fechaSeleccionada = this.today;
    this.onFechaChange();

    this.subs.add(
      this.apptService.getAllAppointments().subscribe(apps => {
        const ahora = Date.now();
        apps.forEach(c => {
          const inicio = new Date(c.datetime).getTime();
          if (c.status === 'confirmed' && inicio + 3600000 < ahora) {
            this.apptService.updateAppointment(c.id!, { status: 'completed' });
          }
        });
        this.citasTodas = apps;
        this.loadCitasDeUsuario();
      })
    );

    this.subs.add(
      this.authService.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.userEmail = user.email ?? '';
          this.subs.add(
            this.profileService.getProfile(user.uid).subscribe(profile => {
              this.userName = profile?.nombre ?? this.userEmail;
            })
          );
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private loadCitasDeUsuario(): void {
    if (!this.uid) {
      this.citasUsuario = [];
      return;
    }

    this.subs.add(
      this.apptService.getUserAppointments(this.uid).subscribe(listUsr => {
        const ahora = Date.now();

        const futuras = listUsr
          .filter(c => new Date(c.datetime).getTime() >= ahora)
          .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

        const pasadas = listUsr
          .filter(c => new Date(c.datetime).getTime() < ahora)
          .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        this.citasUsuario = [...futuras, ...pasadas];
        this.paginaActual = 1;
      })
    );
  }

  get proximaCitaId(): string | null {
    const ahora = Date.now();
    const futuras = this.citasUsuario
      .filter(c => c.status === 'confirmed' && new Date(c.datetime).getTime() >= ahora)
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    return futuras.length ? futuras[0].id ?? null : null;
  }

  esCitaPasada(c: Appointment): boolean {
    return new Date(c.datetime).getTime() < Date.now();
  }

  esProximaCita(c: Appointment): boolean {
    return c.id === this.proximaCitaId;
  }

  onFechaChange(): void {
    this.horaSeleccionada = '';
    this.enEdicion = false;
    this.citaEnEdicion = undefined;
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
    if (sel > ahora) this.todosHorasPasaron = false;
    else if (sel < inicioHoy) this.todosHorasPasaron = true;
    else {
      const mn = ahora.getHours() * 60 + ahora.getMinutes();
      this.todosHorasPasaron = !this.horarios.some(h => this.horaEnMinutos(h) > mn);
    }
  }

  public isHorarioDisponible(h: string): boolean {
    if (!this.fechaSeleccionada) return false;
    const ahora = new Date();
    const sel = new Date(`${this.fechaSeleccionada}T00:00:00`);
    const mn = ahora.getHours() * 60 + ahora.getMinutes();
    if (sel.toDateString() === ahora.toDateString() && this.horaEnMinutos(h) <= mn) {
      return false;
    }
    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(h)}:00`).toISOString();
    if (this.enEdicion && this.citaEnEdicion?.datetime === iso) return true;
    return !this.citasTodas.some(c => c.datetime === iso && c.status !== 'canceled');
  }

  private horaEnMinutos(h12: string): number {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(v => +v);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  public puedeCancelar(c: Appointment): boolean {
    return new Date(c.datetime).getTime() - Date.now() >= 24 * 3600000;
  }

  editarCita(c: Appointment): void {
    if (!this.puedeCancelar(c)) {
      Swal.fire('Aviso', 'Solo se permite editar con ≥24 h de antelación.', 'warning');
      return;
    }
    this.enEdicion = true;
    this.citaEnEdicion = c;
    const dt = new Date(c.datetime);
    this.fechaSeleccionada = dt.toISOString().split('T')[0];
    this.horaSeleccionada = this.formateaHora(c.datetime);
    Swal.fire('Editando cita', `Cita para ${this.formateaFecha(c.datetime)} a las ${this.horaSeleccionada}`, 'info');
    this.verificarSiHorasPasaron();
  }

  cancelarCitaEspecifica(c: Appointment): void {
    if (!this.puedeCancelar(c)) {
      Swal.fire('Aviso', 'Solo se permite cancelar con ≥24 h de antelación.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Cancelar cita?',
      text: `¿Desea cancelar la cita del ${this.formateaFecha(c.datetime)} a las ${this.formateaHora(c.datetime)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.apptService.updateAppointment(c.id!, { status: 'canceled' })
          .then(() => this.emailService.sendCitaCancelada(this.userEmail, {
            nombre: this.userName,
            fecha: this.formateaFecha(c.datetime),
            hora: this.formateaHora(c.datetime),
            ubicacion: 'Clínica NutriSmart'
          }))
          .then(() => {
            Swal.fire({
              title: 'Cita cancelada',
              text: 'Tu cita ha sido cancelada correctamente. Se envió un correo con la confirmación de la cancelación.',
              icon: 'success',
              confirmButtonColor: '#a1c037'
            });
            this.loadCitasDeUsuario();
          })
          .catch(() => Swal.fire('Error', 'Error al cancelar la cita.', 'error'));
      }
    });
  }

  guardarCita(): void {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      Swal.fire('Aviso', 'Por favor seleccione una fecha y hora válidas.', 'warning');
      return;
    }

    Swal.fire({
      title: this.enEdicion ? 'Actualizando cita...' : 'Procesando tu cita...',
      html: `
        <img src="assets/images/logontg.png" alt="Nutrition To Go"
             style="width: 90px; margin-bottom: 10px;">
        <br><b>Por favor espera un momento</b>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    const iso = new Date(`${this.fechaSeleccionada}T${this.to24h(this.horaSeleccionada)}:00`).toISOString();

    const finalizar = (msg: string, correo: boolean) => {
      Swal.close();
      Swal.fire({
        title: 'Cita confirmada',
        html: correo
          ? `${msg}<br><br>Se envió un correo de confirmación con los detalles de la cita.`
          : msg,
        icon: 'success',
        confirmButtonColor: '#a1c037'
      });
      if (this.enEdicion) this.cancelarEdicion();
      else this.fechaSeleccionada = this.today;
      this.horaSeleccionada = '';
      this.loadCitasDeUsuario();
    };

    // === CASO 1: Reagendar cita existente ===
    if (this.enEdicion && this.citaEnEdicion && this.citaEnEdicion.id) {
      const citaAntiguaId = this.citaEnEdicion.id;

      this.apptService.updateAppointment(citaAntiguaId, { datetime: iso })
        .then(() => this.emailService.sendCitaActualizada(this.userEmail, {
          nombre: this.userName,
          fecha: this.formatFullDate(iso),
          hora: this.formateaHora(iso),
          ubicacion: 'Clínica NutriSmart'
        }))
        .then(() => finalizar(`Tu cita fue reprogramada para ${this.formateaFecha(iso)} a las ${this.horaSeleccionada}.`, true))
        .catch(() => {
          Swal.close();
          Swal.fire('Error', 'No se pudo actualizar la cita.', 'error');
        });

    // === CASO 2: Nueva cita ===
    } else {
      const activa = this.citasUsuario.find(c => c.status === 'confirmed' && !this.esCitaPasada(c));
      const crearNueva = () => {
        this.apptService.createAppointment({ userId: this.uid, datetime: iso, status: 'confirmed' })
          .then(() => this.emailService.sendCitaConfirmada(this.userEmail, {
            nombre: this.userName,
            fecha: this.formatFullDate(iso),
            hora: this.formateaHora(iso),
            ubicacion: 'Clínica NutriSmart'
          }))
          .then(() => finalizar(`Tu cita fue programada para ${this.formateaFecha(iso)} a las ${this.horaSeleccionada}.`, true))
          .catch(() => {
            Swal.close();
            Swal.fire('Error', 'No se pudo crear la cita. Intenta nuevamente.', 'error');
          });
      };

      if (activa && activa.id) {
        this.apptService.updateAppointment(activa.id, { status: 'canceled' })
          .then(() => crearNueva());
      } else {
        crearNueva();
      }
    }
  }

  cancelarEdicion(): void {
    this.enEdicion = false;
    this.citaEnEdicion = undefined;
    this.fechaSeleccionada = this.today;
    this.horaSeleccionada = '';
    this.verificarSiHorasPasaron();
  }

  private to24h(h12: string): string {
    const [t, mer] = h12.split(' ');
    let [h, m] = t.split(':').map(v => +v);
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  formateaFecha(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  formateaHora(iso: string): string {
    const d = new Date(iso);
    const h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get citasPaginadas(): Appointment[] {
    const inicio = (this.paginaActual - 1) * this.citasPorPagina;
    return this.citasUsuario.slice(inicio, inicio + this.citasPorPagina);
  }

  totalPaginas(): number {
    return Math.ceil(this.citasUsuario.length / this.citasPorPagina);
  }

  cambiarPagina(direccion: number): void {
    const nueva = this.paginaActual + direccion;
    if (nueva >= 1 && nueva <= this.totalPaginas()) this.paginaActual = nueva;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaActual = pagina;
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas();
    const bloque = Math.floor((this.paginaActual - 1) / this.tamañoBloque);
    const inicio = bloque * this.tamañoBloque + 1;
    const fin = Math.min(inicio + this.tamañoBloque - 1, total);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  hayBloqueAnterior(): boolean {
    return this.paginasVisibles[0] > 1;
  }

  hayBloqueSiguiente(): boolean {
    return this.paginasVisibles[this.paginasVisibles.length - 1] < this.totalPaginas();
  }

  irABloqueAnterior(): void {
    this.irAPagina(this.paginasVisibles[0] - 1);
  }

  irABloqueSiguiente(): void {
    this.irAPagina(this.paginasVisibles[this.paginasVisibles.length - 1] + 1);
  }
}
