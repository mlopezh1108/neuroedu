import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProfileService, StudentProfile } from '../services/profile.service';
import { GeminiService } from '../services/gemini.service';
import { MaterialService, GeneratedMaterial } from '../services/material.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="font-bold! text-gray-800">Confirmar Eliminación</h2>
    <mat-dialog-content>
      <p class="text-gray-600 mt-2">¿Estás seguro de que deseas eliminar este perfil estudiantil permanentemente? Esta acción no se puede deshacer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="pb-6! px-6!">
      <button mat-button mat-dialog-close class="text-gray-500!">Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true" class="ml-2!">Eliminar</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {}

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-generate-material-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="font-bold! text-primary flex items-center gap-2">
      <mat-icon class="text-accent">auto_awesome</mat-icon> Generar Material Didáctico
    </h2>
    <mat-dialog-content class="pt-4! max-h-[70vh]">
      @if (!isGenerating) {
        <p class="text-gray-600 mb-6">Especifica los detalles para generar el material adaptado al perfil <strong>{{ data.anonymousId }}</strong>.</p>
        
        <div class="flex flex-col space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Materia o Asignatura</mat-label>
            <input matInput [(ngModel)]="subject" placeholder="Ej. Biología, Matemáticas..." [disabled]="isGenerating">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Tema Principal</mat-label>
            <input matInput [(ngModel)]="topic" placeholder="Ej. La célula animal, Fracciones..." [disabled]="isGenerating">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Subtema Específico (Opcional)</mat-label>
            <input matInput [(ngModel)]="subTopic" placeholder="Ej. Las mitocondrias, Suma de fracciones con distinto denominador..." [disabled]="isGenerating">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Comentarios extras para la IA (Opcional)</mat-label>
            <textarea matInput [(ngModel)]="additionalComments" placeholder="Ej. Enfoca el material en mitología nórdica, usa un tono de aventura cósmica, etc." [disabled]="isGenerating" rows="3"></textarea>
          </mat-form-field>
        </div>
      }

      @if (isGenerating) {
        <div class="flex flex-col items-center justify-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p class="text-gray-500 font-medium animate-pulse text-center">Analizando necesidades adaptativas y consultando a Gemini AI...</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="pb-6! px-6!">
      <button mat-button mat-dialog-close class="text-gray-500!" [disabled]="isGenerating">Cancelar</button>
      <button mat-flat-button color="primary" class="ml-2!" [disabled]="!subject || !topic || isGenerating" (click)="generateMaterial()">
        <mat-icon class="mr-1">auto_awesome</mat-icon> Generar Documento
      </button>
    </mat-dialog-actions>
  `
})
export class GenerateMaterialDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  private geminiService = inject(GeminiService);
  private cdr = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<GenerateMaterialDialogComponent>);
  private router = inject(Router);
  
  subject = '';
  topic = '';
  subTopic = '';
  additionalComments = '';
  isGenerating = false;

  async generateMaterial() {
    this.isGenerating = true;
    this.cdr.detectChanges();
    try {
      const generatedContent = await this.geminiService.generateMaterial(this.data, this.subject, this.topic, this.subTopic, this.additionalComments);
      
      this.dialogRef.close();
      this.router.navigate(['/material-editor'], { 
        state: { 
          content: generatedContent, 
          profile: this.data,
          subject: this.subject,
          topic: this.topic,
          subTopic: this.subTopic
        }
      });
    } catch (error) {
      console.error(error);
      this.isGenerating = false;
      this.cdr.detectChanges();
      alert('Hubo un error conectando con la API de Gemini. Revisa la consola para más detalles.');
    }
  }
}

@Component({
  selector: 'app-material-list-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="flex justify-between items-start pt-6 px-6 pb-2">
      <h2 mat-dialog-title class="font-bold! text-primary flex items-center m-0! p-0!">
        <mat-icon class="text-accent mr-2">folder_special</mat-icon> Archivo Documental
      </h2>
      <button mat-icon-button mat-dialog-close class="text-gray-400 hover:text-gray-600 transition-colors -mt-2 -mr-2">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="pt-4! pb-6! max-h-[70vh] min-w-[500px]">
      <p class="text-sm text-gray-500 mb-6 mt-1">Materiales didácticos rescatados bajo el perfil <strong>{{ data.anonymousId }}</strong></p>
      
      @if (isLoading) {
        <div class="flex flex-col items-center justify-center p-12 text-gray-400">
          <mat-icon class="animate-spin text-primary scale-150 mb-4">sync</mat-icon>
          <span class="text-sm">Buscando en la bóveda de la nube...</span>
        </div>
      } @else if (materials.length === 0) {
        <div class="text-center p-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
          <mat-icon class="text-5xl mb-3 opacity-30">description_empty</mat-icon>
          <p class="font-medium text-gray-500">Bóveda vacía</p>
          <p class="text-xs mt-1">Todavía no has guardado material didáctico para este perfil.</p>
        </div>
      } @else {
        <div class="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
          @for (mat of materials; track mat.id) {
            <div class="px-5 py-4 border-b border-gray-200 last:border-b-0 hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-between group" (click)="openEditor(mat)">
              <div class="flex items-center gap-3">
                <mat-icon class="text-gray-400 group-hover:text-primary transition-colors">description</mat-icon>
                <span class="font-medium text-gray-800 group-hover:text-primary transition-colors">{{ mat.title }}</span>
              </div>
              <button mat-icon-button class="text-primary opacity-0 group-hover:opacity-100 transition-opacity scale-90" matTooltip="Restaurar al editor">
                <mat-icon>edit_document</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </mat-dialog-content>
  `
})
export class MaterialListDialogComponent implements OnInit {
  data = inject(MAT_DIALOG_DATA);
  router = inject(Router);
  dialogRef = inject(MatDialogRef);
  materialService = inject(MaterialService);
  private cdr = inject(ChangeDetectorRef);
  
  materials: GeneratedMaterial[] = [];
  isLoading = true;

  async ngOnInit() {
    try {
      this.materials = await this.materialService.getMaterialsByProfile(this.data.id);
    } catch (e) {
      console.error('Error fetching materials:', e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  openEditor(material: GeneratedMaterial) {
    this.dialogRef.close();
    this.router.navigate(['/material-editor'], {
      state: { 
        content: material.content, 
        profile: this.data 
        // No pasamos materia/tema nuevos porque este material pre-existente 
        // ya viene formateado y titulado implícitamente en el markdown histórico
      }
    });
  }
}


@Component({
  selector: 'app-student-list',
  imports: [AsyncPipe, MatCardModule, MatChipsModule, MatIconModule, MatDividerModule, MatButtonModule, MatDialogModule, MatTooltipModule],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
})
export class StudentList implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  
  profiles$!: Observable<StudentProfile[]>;

  ngOnInit() {
    this.profiles$ = this.profileService.getProfiles();
  }

  editProfile(profile: StudentProfile) {
    if (profile.id) {
      this.router.navigate(['/profile', profile.id]);
    }
  }

  openGenerateMaterialDialog(profile: StudentProfile) {
    this.dialog.open(GenerateMaterialDialogComponent, {
      width: '500px',
      data: profile
    });
  }

  openMaterialListDialog(profile: StudentProfile) {
    this.dialog.open(MaterialListDialogComponent, {
      width: '600px',
      position: { top: '50px' },
      data: profile
    });
  }

  async deleteProfile(profileId: string | undefined) {
    if (!profileId) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.profileService.deleteProfile(profileId);
      }
    });
  }
}

