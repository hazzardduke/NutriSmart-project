import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Subscription }                  from 'rxjs';
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
  profileForm: FormGroup;
  photoURL: string | null = null;
  updateMessage = '';
  private uid!: string;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private profileService: ProfileService
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
    const subAuth = this.auth.user$.subscribe(user => {
      if (user) {
        this.uid = user.uid;
        this.loadProfile();
      }
    });
    this.subs.add(subAuth);
  }

  private loadProfile(): void {
    const sub = this.profileService.getProfile(this.uid).subscribe(data => {
      this.profileForm.patchValue({
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        correo: data.correo || '',
        peso: data.peso != null ? data.peso.toString() : '',
        estatura: data.estatura != null ? data.estatura.toString() : '',
        porcentajeGrasa: data.porcentajeGrasa != null ? data.porcentajeGrasa.toString() : '',
        porcentajeMusculo: data.porcentajeMusculo != null ? data.porcentajeMusculo.toString() : '',
        porcentajeAgua: data.porcentajeAgua != null ? data.porcentajeAgua.toString() : '',
        restricciones: data.restricciones || ''
      });
      this.photoURL = data.fotoURL || null;
    });
    this.subs.add(sub);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      this.profileService.uploadPhoto(this.uid, file).subscribe(url => {
        this.photoURL = url;
        this.updateMessage = 'Foto actualizada con éxito';
      });
    }
  }

  saveChanges(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const raw = this.profileForm.value;
    const data: Partial<UserProfileData> = {
      direccion: raw.direccion,
      telefono: raw.telefono,
      correo: raw.correo,
      peso: parseFloat(raw.peso),
      estatura: parseFloat(raw.estatura),
      porcentajeGrasa: parseFloat(raw.porcentajeGrasa),
      porcentajeMusculo: parseFloat(raw.porcentajeMusculo),
      porcentajeAgua: parseFloat(raw.porcentajeAgua),
      restricciones: raw.restricciones
    };
    this.profileService.updateProfile(this.uid, data)
      .then(() => this.updateMessage = 'Actualización exitosa')
      .catch(err => console.error(err));
  }

  removePhoto(): void {
    this.profileService.updateProfile(this.uid, { fotoURL: '' })
      .then(() => {
        this.photoURL = null;
        this.updateMessage = 'Foto eliminada';
      });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
