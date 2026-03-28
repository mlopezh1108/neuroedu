import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService, StudentProfile } from '../services/profile.service';

@Component({
  selector: 'app-profile-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './profile-form.html',
  styleUrl: './profile-form.css',
})
export class ProfileForm implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = false;
  profileId: string | null = null;

  profileDataForm: FormGroup = this.fb.group({
    anonymousId: [''],
    sensory: this.fb.group({
      auditory: [''],
      visual: ['']
    }),
    cognitive: this.fb.group({
      visualThinking: [false],
      verbalThinking: [false],
      kinestheticThinking: [false],
      analyticalThinking: [false],
      holisticThinking: [false],
      stepByStep: [false],
      verbalDifficulty: [false]
    }),
    regulation: this.fb.group({
      anticipation: [false],
      socialStories: [false],
      moreTime: [false]
    })
  });

  async ngOnInit() {
    this.profileId = this.route.snapshot.paramMap.get('id');
    if (this.profileId) {
      this.isEditMode = true;
      try {
        const existingProfile = await this.profileService.getProfileById(this.profileId);
        if (existingProfile) {
          this.profileDataForm.patchValue(existingProfile);
        } else {
          this.snackBar.open('Perfil no encontrado.', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/students']);
        }
      } catch (error) {
        console.error('Error cargando el perfil:', error);
      }
    }
  }

  async submitForm() {
    try {
      const payload: StudentProfile = this.profileDataForm.value;
      if (this.isEditMode && this.profileId) {
        await this.profileService.updateProfile(this.profileId, payload);
        this.snackBar.open('¡Perfil actualizado correctamente!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
      } else {
        await this.profileService.saveProfile(payload);
        this.snackBar.open('¡Perfil guardado correctamente en Firebase!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
      }
      this.router.navigate(['/students']);
    } catch (error) {
      console.error('Error procesando perfil:', error);
      this.snackBar.open('Hubo un error al guardar los cambios.', 'Cerrar', {
        duration: 3000,
        panelClass: ['bg-red-500', 'text-white']
      });
    }
  }
}
