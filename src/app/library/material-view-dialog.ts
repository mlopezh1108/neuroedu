import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-material-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex justify-between items-start px-4 sm:px-6 py-4 border-b w-full box-border relative">
      <h2 mat-dialog-title class="m-0 text-lg sm:text-xl font-bold text-gray-800 break-words line-clamp-2 flex-1 pr-10 leading-tight block">{{ data.title }}</h2>
      <button mat-icon-button (click)="close()" class="absolute right-2 top-2 sm:right-4 sm:top-4 shrink-0 text-gray-500 hover:text-gray-800">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="mat-typography p-4 sm:p-6 custom-scrollbar bg-gray-50/50 min-h-[50vh] overflow-x-hidden flex flex-col box-border">
      <article class="print-container prose prose-sm sm:prose-base prose-slate prose-headings:text-primary prose-a:text-accent w-full max-w-none bg-white p-4 sm:p-8 md:p-10 rounded-xl shadow-sm border border-gray-100 box-border break-words" [innerHTML]="parsedContent">
      </article>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 w-full box-border">
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `
})
export class MaterialViewDialog {
  parsedContent: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { content: string, title: string },
    private dialogRef: MatDialogRef<MaterialViewDialog>
  ) {
    this.parseMarkdown();
  }

  async parseMarkdown() {
    try {
      const parsed = await marked.parse(this.data.content);
      this.parsedContent = DOMPurify.sanitize(parsed);
    } catch (e) {
      console.error(e);
      this.parsedContent = '<p>Error cargando contenido.</p>';
    }
  }

  close() {
    this.dialogRef.close();
  }
}
