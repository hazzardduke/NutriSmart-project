import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { ProfileService, UserProfileData } from '../../services/profile.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form: FormGroup;
  photoURL: string | null = null;
  uid!: string;
  subs = new Subscription();

  activeTab: 'photo' | 'data' = 'photo';
  private readonly MAX_DIM = 500;
  private readonly QUALITY = 0.7;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private profileService: ProfileService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      cedula: ['', [Validators.required, Validators.pattern(/^\d{9,12}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      direccion: ['', Validators.required],
      fechaNacimiento: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.subs.add(
      this.auth.user$.subscribe(user => {
        if (user) {
          this.uid = user.uid;
          this.loadProfile();
        }
      })
    );
  }

  async loadProfile() {
    try {
      const data: UserProfileData = await firstValueFrom(this.profileService.getProfile(this.uid));
      this.photoURL = data.fotoURL || null;
      this.form.patchValue({
        nombre: data.nombre || '',
        apellido: data.apellido || data.apellidos || '',
        correo: data.correo || '',
        cedula: data.cedula || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        fechaNacimiento: data.fechaNacimiento || ''
      });
    } catch {
      this.showError('No se pudieron cargar los datos del perfil.');
    }
  }

  selectTab(tab: 'photo' | 'data') {
    this.activeTab = tab;
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const [w, h] = this.calcSize(img.width, img.height);
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

  calcSize(w: number, h: number): [number, number] {
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
        this.fileInput.nativeElement.value = '';

        Swal.fire({
          title: '<img src="assets/images/logontg.png" style="width:90px; margin-bottom:10px;"><br>¡Foto actualizada!',
          text: 'La foto de perfil se ha guardado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#a1c037',
          background: '#ffffff',
          color: '#2f3b44'
        }).then(() => {
          window.location.reload();
        });
      })
      .catch(() => {
        this.showError('Ocurrió un error al guardar la foto.');
      });
  }

  saveData() {
    if (this.form.invalid) return this.showError('Corrige los campos obligatorios antes de guardar.');

    this.profileService.updateProfile(this.uid, this.form.value)
      .then(() => {
        Swal.fire({
          title: '<img src="assets/images/logontg.png" style="width:90px; margin-bottom:10px;"><br>¡Datos actualizados!',
          text: 'Los datos personales se actualizaron correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#a1c037',
          background: '#ffffff',
          color: '#2f3b44'
        });
      })
      .catch(() => {
        this.showError('No se pudo actualizar la información.');
      });
  }

  showError(msg: string) {
    Swal.fire({
      icon: 'error',
      title: '<img src="assets/images/logontg.png" style="width:80px; margin-bottom:10px;"><br>Error',
      text: msg,
      confirmButtonColor: '#a1c037',
      background: '#ffffff',
      color: '#2f3b44'
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
