import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ProfileService, UserProfileData } from '../../../services/profile.service';

@Component({
  selector: 'app-personalrecord',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './personalrecord.component.html',
  styleUrls: ['./personalrecord.component.scss']
})
export class PersonalrecordComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  photoURL: string | null = null;
  private uid!: string;
  private subs = new Subscription();
  private pendingFile: File | null = null;

  // Control de qué sección se muestra
  currentSection: 'photo' | 'personal' | 'nutritional' | 'restrictions' = 'photo';

  // Popup de mensajes
  showPopup = false;
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';

  // Meta-data de campos nutricionales
  nutricionales = [
    { id: 'peso', control: 'peso', label: 'Peso (kg)', type: 'number', step: '1' },
    { id: 'estatura', control: 'estatura', label: 'Estatura (m)', type: 'number', step: '0.01' },
    { id: 'porcentajeGrasa', control: 'porcentajeGrasa', label: '% Grasa', type: 'number', step: '0.1' },
    { id: 'porcentajeMusculo', control: 'porcentajeMusculo', label: '% Músculo', type: 'number', step: '0.1' },
    { id: 'porcentajeAgua', control: 'porcentajeAgua', label: '% Agua', type: 'number', step: '0.1' }
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private profileService: ProfileService,
    private zone: NgZone,
    private cd: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      direccion:       ['', Validators.required],
      telefono:        ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      correo:          ['', [Validators.required, Validators.email]],
      peso:            ['', Validators.required],
      estatura:        ['', Validators.required],
      porcentajeGrasa: ['', Validators.required],
      porcentajeMusculo: ['', Validators.required],
      porcentajeAgua:  ['', Validators.required],
      restricciones:   ['']
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.auth.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.loadProfileOnce();
        }
      })
    );
  }

  private async loadProfileOnce(): Promise<void> {
    try {
      const data: UserProfileData = await firstValueFrom(
        this.profileService.getProfile(this.uid)
      );
      this.zone.run(() => {
        this.photoURL = data.fotoURL || null;
        this.profileForm.patchValue({
          direccion: data.direccion || '',
          telefono:  data.telefono  || '',
          correo:    data.correo    || '',
          peso:            data.peso?.toString()            || '',
          estatura:        data.estatura?.toString()        || '',
          porcentajeGrasa: data.porcentajeGrasa?.toString() || '',
          porcentajeMusculo: data.porcentajeMusculo?.toString() || '',
          porcentajeAgua:  data.porcentajeAgua?.toString()  || '',
          restricciones:   data.restricciones   || ''
        });
        this.cd.detectChanges();
      });
    } catch (err) {
      console.error('Error cargando perfil:', err);
      this.popup('No se pudo cargar los datos. Reintenta más tarde.', 'error');
    }
  }

  selectSection(sec: 'photo'|'personal'|'nutritional'|'restrictions'): void {
    this.currentSection = sec;
  }

  // --- FOTO ---
  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    this.pendingFile = file;
  }

  removePhoto(): void {
    this.photoURL = null;
    this.pendingFile = null;
    this.popup('Foto marcada para eliminar. Guarda los cambios.', 'success');
  }

  async savePhoto(): Promise<void> {
    try {
      let url = this.photoURL || '';
      if (this.pendingFile) {
        url = await firstValueFrom(this.profileService.uploadPhoto(this.uid, this.pendingFile));
      }
      await this.profileService.updateProfile(this.uid, { fotoURL: url });
      this.zone.run(() => {
        this.photoURL = url;
        this.popup('Foto guardada correctamente.', 'success');
        this.cd.detectChanges();
      });
    } catch {
      this.popup('Error al guardar la foto.', 'error');
    }
  }

  // --- DATOS PERSONALES ---
  async savePersonal(): Promise<void> {
    const f = this.profileForm;
    if (f.get('direccion')!.invalid || f.get('telefono')!.invalid || f.get('correo')!.invalid) {
      this.popup('Corrige los campos obligatorios.', 'error');
      return;
    }
    try {
      const { direccion, telefono, correo } = f.value;
      await this.profileService.updateProfile(this.uid, { direccion, telefono, correo });
      this.popup('Datos personales guardados.', 'success');
    } catch {
      this.popup('Error al guardar datos personales.', 'error');
    }
  }

  // --- DATOS NUTRICIONALES ---
  async saveNutritional(): Promise<void> {
    const f = this.profileForm;
    const ctrls = ['peso','estatura','porcentajeGrasa','porcentajeMusculo','porcentajeAgua'];
    if (ctrls.some(c => f.get(c)!.invalid)) {
      this.popup('Corrige los campos nutricionales.', 'error');
      return;
    }
    try {
      const { peso, estatura, porcentajeGrasa, porcentajeMusculo, porcentajeAgua } = f.value;
      await this.profileService.updateProfile(this.uid, {
        peso: +peso,
        estatura: +estatura,
        porcentajeGrasa:   +porcentajeGrasa,
        porcentajeMusculo: +porcentajeMusculo,
        porcentajeAgua:    +porcentajeAgua
      });
      this.popup('Datos nutricionales guardados.', 'success');
    } catch {
      this.popup('Error al guardar datos nutricionales.', 'error');
    }
  }

  // --- RESTRICCIONES ---
  async saveRestrictions(): Promise<void> {
    try {
      const { restricciones } = this.profileForm.value;
      await this.profileService.updateProfile(this.uid, { restricciones });
      this.popup('Restricciones guardadas.', 'success');
    } catch {
      this.popup('Error al guardar restricciones.', 'error');
    }
  }

  // --- POPUP ---
  popup(message: string, type: 'success'|'error') {
    this.zone.run(() => {
      this.popupMessage = message;
      this.popupType    = type;
      this.showPopup    = true;
      this.cd.detectChanges();
    });
  }
  closePopup() { this.showPopup = false; }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
