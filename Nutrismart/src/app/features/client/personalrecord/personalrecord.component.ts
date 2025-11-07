import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';
import { ProfileService, UserProfileData } from '../../../services/profile.service';

@Component({
  selector: 'app-personalrecord',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personalrecord.component.html',
  styleUrls: ['./personalrecord.component.scss']
})
export class PersonalrecordComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileForm: FormGroup;
  photoURL: string | null = null;
  uid!: string;
  subs = new Subscription();
  currentSection: 'photo' | 'personal' | 'nutritional' | 'restrictions' = 'photo';

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
    private profileService: ProfileService
  ) {
    this.profileForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      cedula: ['', [Validators.required, Validators.pattern(/^\d{9,12}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      direccion: ['', Validators.required],
      peso: [''],
      estatura: [''],
      porcentajeGrasa: [''],
      porcentajeMusculo: [''],
      porcentajeAgua: [''],
      restricciones: ['']
    });
  }

  ngOnInit() {
    this.subs.add(
      this.auth.user$.subscribe(async user => {
        if (user) {
          this.uid = user.uid;
          const data: UserProfileData = await firstValueFrom(this.profileService.getProfile(this.uid));
          this.photoURL = data.fotoURL || null;
          this.profileForm.patchValue({
            nombre: data.nombre || '',
            apellidos: data.apellidos || data.apellido || '',
            cedula: data.cedula || '',
            telefono: data.telefono || '',
            correo: data.correo || '',
            direccion: data.direccion || '',
            peso: data.peso || '',
            estatura: data.estatura || '',
            porcentajeGrasa: data.porcentajeGrasa || '',
            porcentajeMusculo: data.porcentajeMusculo || '',
            porcentajeAgua: data.porcentajeAgua || '',
            restricciones: data.restricciones || ''
          });
        }
      })
    );
  }

  selectSection(sec: 'photo'|'personal'|'nutritional'|'restrictions') {
    this.currentSection = sec;
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const [w, h] = this.resizeImage(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        this.photoURL = canvas.toDataURL('image/jpeg', this.QUALITY);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private resizeImage(w: number, h: number): [number, number] {
    if (w > h && w > this.MAX_DIM) {
      h = Math.round(h * (this.MAX_DIM / w));
      w = this.MAX_DIM;
    } else if (h > this.MAX_DIM) {
      w = Math.round(w * (this.MAX_DIM / h));
      h = this.MAX_DIM;
    }
    return [w, h];
  }

  savePhoto() {
    if (!this.photoURL) return this.showError('Selecciona una imagen antes de guardar.');

    this.profileService.updateProfile(this.uid, { fotoURL: this.photoURL })
      .then(() => {
        Swal.fire({
          title: '<img src="assets/images/logontg.png" style="width:90px; margin-bottom:10px;"><br>¡Foto actualizada!',
          text: 'La foto de perfil se ha guardado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#a1c037'
        }).then(() => {
          window.location.reload();
        });
      })
      .catch(() => this.showError('Ocurrió un error al guardar la foto.'));
  }

  savePersonal() {
    if (this.profileForm.invalid) return this.showError('Corrige los campos obligatorios.');

    const { nombre, apellidos, cedula, telefono, correo, direccion } = this.profileForm.value;
    this.profileService.updateProfile(this.uid, { nombre, apellidos, cedula, telefono, correo, direccion })
      .then(() => {
        this.showSuccess('Datos personales actualizados correctamente.');
      })
      .catch(() => this.showError('No se pudo actualizar la información.'));
  }

  saveNutritional() {
    const { peso, estatura, porcentajeGrasa, porcentajeMusculo, porcentajeAgua } = this.profileForm.value;
    this.profileService.updateProfile(this.uid, {
      peso: +peso,
      estatura: +estatura,
      porcentajeGrasa: +porcentajeGrasa,
      porcentajeMusculo: +porcentajeMusculo,
      porcentajeAgua: +porcentajeAgua
    })
      .then(() => this.showSuccess('Datos nutricionales guardados correctamente.'))
      .catch(() => this.showError('Error al guardar los datos nutricionales.'));
  }

  saveRestrictions() {
    const { restricciones } = this.profileForm.value;
    this.profileService.updateProfile(this.uid, { restricciones })
      .then(() => this.showSuccess('Restricciones guardadas correctamente.'))
      .catch(() => this.showError('Error al guardar restricciones.'));
  }

  showSuccess(msg: string) {
    Swal.fire({
      title: '<img src="assets/images/logontg.png" style="width:90px; margin-bottom:10px;"><br>¡Éxito!',
      text: msg,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#a1c037'
    });
  }

  showError(msg: string) {
    Swal.fire({
      title: '<img src="assets/images/logontg.png" style="width:90px; margin-bottom:10px;"><br>Error',
      text: msg,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#a1c037'
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
