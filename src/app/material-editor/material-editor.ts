import { Component, OnInit, inject, ViewEncapsulation, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StudentProfile } from '../services/profile.service';
import { MaterialService } from '../services/material.service';

@Component({
  selector: 'app-save-material-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Archivar Material</h2>
    <mat-dialog-content class="pt-2! pb-0!">
      <p class="text-gray-600 mb-4">Ingresa un título para archivar este material didáctico:</p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Título del Documento</mat-label>
        <input matInput [(ngModel)]="title" cdkFocusInitial placeholder="Ej. Guía Adaptada" (keyup.enter)="onEnter()">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="px-6 pb-4">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!title.trim()" [mat-dialog-close]="title">Confirmar</button>
    </mat-dialog-actions>
  `
})
export class SaveMaterialDialog {
  title: string;
  constructor(
    public dialogRef: MatDialogRef<SaveMaterialDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { defaultTitle: string }
  ) {
    this.title = data.defaultTitle;
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  onEnter(): void {
    if (this.title.trim()) {
      this.dialogRef.close(this.title);
    }
  }
}


@Component({
  selector: 'app-material-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDividerModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './material-editor.html',
  styleUrl: './material-editor.css',
  encapsulation: ViewEncapsulation.None
})
export class MaterialEditor implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private materialService = inject(MaterialService);
  private dialog = inject(MatDialog);
  
  rawContent: string = '';
  parsedContent: string = '';
  profile: StudentProfile | null = null;
  wordCount = 0;
  defaultTitle = 'Nuevo Material Didáctico';
  isSaving = false;
  isEditMode = false;
  materialId?: string;
  
  metaSubject = 'General';
  metaTopic = 'General';
  metaSubTopic = '';
  metaSchoolLevel = '';

  ngOnInit() {
    // Recuperar el contenido enviado desde el modal de la página anterior
    const stateContent = history.state.content;
    const stateProfile = history.state.profile;
    const stateSubject = history.state.subject;
    const stateTopic = history.state.topic;
    const stateSubTopic = history.state.subTopic;
    const stateSchoolLevel = history.state.schoolLevel;
    const materialId = history.state.materialId;
    
    if (materialId) {
      this.isEditMode = true;
      this.materialId = materialId;
    }

    if (stateSubject && stateTopic) {
      this.metaSubject = stateSubject;
      this.metaTopic = stateTopic;
      this.metaSubTopic = stateSubTopic || '';
      this.metaSchoolLevel = stateSchoolLevel || '';
      this.defaultTitle = `${stateSubject} - ${stateTopic}${this.metaSubTopic ? ` (${this.metaSubTopic})` : ''}`;
    }
    
    if (stateContent) {
      this.rawContent = stateContent;
      this.profile = stateProfile;
      this.updatePreview();
    } else {
      // Si entra a esta ruta sin datos (ej. refrescando), lo regresamos a los estudiantes
      this.router.navigate(['/students']);
    }
  }

  async updatePreview() {
    try {
      const parsed = await marked.parse(this.rawContent);
      this.parsedContent = DOMPurify.sanitize(parsed);
      this.wordCount = this.rawContent.trim() ? this.rawContent.trim().split(/\s+/).length : 0;
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error parseando Markdown', e);
    }
  }

  onContentChange() {
    this.updatePreview();
  }

  goBack() {
    this.router.navigate(['/students']);
  }

  async saveToDatabase() {
    const currentProfile = this.profile;
    const profileId = currentProfile?.id;
    
    if (!currentProfile || !profileId) {
      this.snackBar.open('Error: No hay un perfil activo asignado.', 'OK');
      return;
    }

    // Si es modo edición, guardar directo sin preguntar
    if (this.isEditMode && this.materialId) {
      await this.executeSave(this.defaultTitle);
      return;
    }
    
    // Si es modo creación, solicitar un título para el nuevo documento
    const dialogRef = this.dialog.open(SaveMaterialDialog, {
      width: '95vw',
      maxWidth: '400px',
      data: { defaultTitle: this.defaultTitle }
    });

    dialogRef.afterClosed().subscribe(async (title) => {
      if (!title) return;
      await this.executeSave(title);
    });
  }

  private async executeSave(title: string) {
    this.isSaving = true;
    this.cdr.detectChanges();

    try {
      const tags = this.materialService.generateTags(this.profile!);
    
      if (this.isEditMode && this.materialId) {
        await this.materialService.updateMaterial(this.materialId, {
          title: title,
          schoolLevel: this.metaSchoolLevel,
          subject: this.metaSubject,
          topic: this.metaTopic,
          subTopic: this.metaSubTopic,
          content: this.rawContent,
          tags: tags
        });
        this.defaultTitle = title;
        this.snackBar.open('¡Material actualizado en la nube exitosamente!', 'OK', { duration: 4000, horizontalPosition: 'center', verticalPosition: 'bottom' });
      } else {
        const result = await this.materialService.saveMaterial({
          profileId: this.profile!.id!,
          profileAnonymousId: this.profile!.anonymousId,
          title: title,
          schoolLevel: this.metaSchoolLevel,
          subject: this.metaSubject,
          topic: this.metaTopic,
          subTopic: this.metaSubTopic,
          content: this.rawContent,
          tags: tags
        });
        
        // Convertimos a modo edición transparente para que los subsecuentes "guardados" solo actualicen
        this.isEditMode = true;
        this.materialId = result.id;
        this.defaultTitle = title;
        
        this.snackBar.open('¡Nuevo material archivado en la nube exitosamente!', 'OK', { duration: 4000, horizontalPosition: 'center', verticalPosition: 'bottom' });
      }
    } catch (error) {
      console.error('Error al guardar material en Firestore', error);
      this.snackBar.open('Ocurrió un error inesperado al guardar el documento.', 'Error', { duration: 3000 });
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  exportPdf() {
    // Al invocar print en la misma pestaña, aprovechamos el @media print ya estructurado en los estilos
    // y evitamos bloqueos de ventanas emergentes (pop-ups) en chrome/safari móviles.
    setTimeout(() => {
      window.print();
    }, 150);
  }
}
