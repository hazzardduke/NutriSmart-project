// src/app/core/client/personalrecord/personalrecord.component.ts

import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileForm: FormGroup;
  photoURL: string | null = null;        // contiene Base64 escalado o URL
  private uid!: string;
  private subs = new Subscription();

  currentSection: 'photo' | 'personal' | 'nutritional' | 'restrictions' = 'photo';
  showPopup = false;
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';

  // Máximo ancho/alto para la imagen + calidad JPEG
  private readonly MAX_DIM = 500;
  private readonly QUALITY = 0.7;

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
      direccion: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      peso: ['', Validators.required],
      estatura: ['', Validators.required],
      porcentajeGrasa: ['', Validators.required],
      porcentajeMusculo: ['', Validators.required],
      porcentajeAgua: ['', Validators.required],
      restricciones: ['']
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
          direccion:       data.direccion       || '',
          telefono:        data.telefono        || '',
          correo:          data.correo          || '',
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

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const [w, h] = this.calculateSize(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        this.zone.run(() => {
          this.photoURL = canvas.toDataURL('image/jpeg', this.QUALITY);
          this.cd.detectChanges();
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private calculateSize(origW: number, origH: number): [number, number] {
    let w = origW, h = origH;
    if (w > h && w > this.MAX_DIM) {
      h = Math.round(h * (this.MAX_DIM / w));
      w = this.MAX_DIM;
    } else if (h >= w && h > this.MAX_DIM) {
      w = Math.round(w * (this.MAX_DIM / h));
      h = this.MAX_DIM;
    }
    return [w, h];
  }

  async savePhoto(): Promise<void> {
    if (!this.photoURL) {
      this.popup('Selecciona una imagen primero.', 'error');
      return;
    }
    try {
      await this.profileService.updateProfile(this.uid, { fotoURL: this.photoURL });
      this.popup('Foto guardada correctamente.', 'success');
      this.fileInput.nativeElement.value = '';
    } catch (err) {
      console.error('Error guardando foto:', err);
      this.popup('Error al guardar la foto.', 'error');
    }
  }

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
        porcentajeGrasa: +porcentajeGrasa,
        porcentajeMusculo: +porcentajeMusculo,
        porcentajeAgua: +porcentajeAgua
      });
      this.popup('Datos nutricionales guardados.', 'success');
    } catch {
      this.popup('Error al guardar datos nutricionales.', 'error');
    }
  }

  async saveRestrictions(): Promise<void> {
    try {
      const { restricciones } = this.profileForm.value;
      await this.profileService.updateProfile(this.uid, { restricciones });
      this.popup('Restricciones guardadas.', 'success');
    } catch {
      this.popup('Error al guardar restricciones.', 'error');
    }
  }

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
