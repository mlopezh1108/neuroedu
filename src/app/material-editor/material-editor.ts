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

  ngOnInit() {
    // Recuperar el contenido enviado desde el modal de la página anterior
    const stateContent = history.state.content;
    const stateProfile = history.state.profile;
    const stateSubject = history.state.subject;
    const stateTopic = history.state.topic;
    const stateSubTopic = history.state.subTopic;
    const materialId = history.state.materialId;
    
    if (materialId) {
      this.isEditMode = true;
      this.materialId = materialId;
    }

    if (stateSubject && stateTopic) {
      this.metaSubject = stateSubject;
      this.metaTopic = stateTopic;
      this.metaSubTopic = stateSubTopic || '';
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
    if (!currentProfile || !profileId) return;
    
    const dialogRef = this.dialog.open(SaveMaterialDialog, {
      width: '400px',
      data: { defaultTitle: this.defaultTitle }
    });

    dialogRef.afterClosed().subscribe(async (title) => {
      if (!title) return;

      this.isSaving = true;
      this.cdr.detectChanges();

      try {
        const tags = this.materialService.generateTags(currentProfile);
      
        if (this.isEditMode && this.materialId) {
          await this.materialService.updateMaterial(this.materialId, {
            title: title,
            subject: this.metaSubject,
            topic: this.metaTopic,
            subTopic: this.metaSubTopic,
            content: this.rawContent,
            tags: tags
          });
          this.snackBar.open('¡Material actualizado exitosamente!', 'OK', { duration: 4000, horizontalPosition: 'center', verticalPosition: 'bottom' });
        } else {
          await this.materialService.saveMaterial({
            profileId: profileId,
            profileAnonymousId: currentProfile.anonymousId,
            title: title,
            subject: this.metaSubject,
            topic: this.metaTopic,
            subTopic: this.metaSubTopic,
            content: this.rawContent,
            tags: tags
          });
          this.snackBar.open('¡Material guardado en la nube exitosamente!', 'OK', { duration: 4000, horizontalPosition: 'center', verticalPosition: 'bottom' });
        }
      } catch (error) {
        console.error('Error al guardar material en Firestore', error);
        this.snackBar.open('Ocurrió un error al guardar el documento.', 'Error', { duration: 3000 });
      } finally {
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  exportPdf() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, deshabilita el bloqueador de ventanas emergentes para poder exportar a PDF.');
      return;
    }

    // Aislamos el contenido en HTML puro sin rastro de Angular o Tailwind
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <title>Material_Didactico_${this.profile?.anonymousId || 'NeuroEdu'}</title>
          <style>
            body { 
              font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              padding: 40px; 
              line-height: 1.6; 
              color: #1f2937; 
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 2.25rem; font-weight: 800; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 1rem; color: #111827; }
            h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #1f2937; margin-left: 0; }
            h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #374151; }
            p { margin-bottom: 1rem; }
            ul { list-style-type: disc; margin-bottom: 1rem; padding-left: 1.5rem; }
            ol { list-style-type: decimal; margin-bottom: 1rem; padding-left: 1.5rem; }
            li { margin-bottom: 0.5rem; }
            blockquote { 
              border-left: 4px solid #6366f1; 
              color: #4b5563; 
              background-color: #f9fafb; 
              padding: 1rem; 
              margin: 1.5rem 0; 
              font-style: italic;
              border-radius: 0 0.5rem 0.5rem 0;
            }
            code { background-color: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; color: #e11d48; font-family: ui-monospace, monospace; font-size: 0.875rem; }
            strong { font-weight: 700; color: #111827; }
            @media print {
              body { padding: 0 !important; max-width: none !important; }
              @page { margin: 2cm; size: A4 portrait; }
              h1, h2, h3 { page-break-after: avoid; }
              p, li, blockquote { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${this.parsedContent}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Esperar a que el navegador dibuje los estilos
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}
