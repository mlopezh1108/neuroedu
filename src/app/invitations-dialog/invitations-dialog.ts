import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvitationService, AuthorizedEmail } from '../services/invitation.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-invitations-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title class="font-bold! text-primary flex items-center justify-between">
      <div class="flex items-center gap-2">
        <mat-icon class="text-accent">person_add</mat-icon>
        Gestionar Invitaciones
      </div>
      <button mat-icon-button (click)="dialogRef.close()" class="text-gray-400">
        <mat-icon>close</mat-icon>
      </button>
    </h2>

    <mat-dialog-content class="pt-2!">
      <p class="text-sm text-gray-500 mb-6">Agrega los correos de Google de los docentes que podrán entrar a la plataforma.</p>

      <!-- Formulario para agregar -->
      <div class="flex gap-2 mb-6">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Correo del docente</mat-label>
          <input matInput [(ngModel)]="newEmail" placeholder="ejemplo@gmail.com" (keyup.enter)="addEmail()">
        </mat-form-field>
        <button mat-flat-button color="primary" class="h-[56px]" [disabled]="!newEmail || isAdding" (click)="addEmail()">
          <mat-icon>add</mat-icon>
          Invitar
        </button>
      </div>

      <!-- Lista de invitados -->
      <div class="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-100/50 text-gray-500 uppercase text-[10px] font-bold">
            <tr>
              <th class="p-3 text-left">Correo Autorizado</th>
              <th class="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            @for (invite of emails$ | async; track invite.id) {
              <tr class="border-t border-gray-100 hover:bg-white transition-colors">
                <td class="p-3 font-medium text-gray-700">{{ invite.email }}</td>
                <td class="p-3 text-right">
                  <button mat-icon-button color="warn" matTooltip="Revocar acceso" (click)="removeEmail(invite.id!)" 
                          [disabled]="invite.email === 'marcoslp36@gmail.com'">
                    <mat-icon class="scale-90">person_remove</mat-icon>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    :host { display: block; }
    mat-form-field { width: 100%; }
    .mat-mdc-dialog-content { min-width: 400px; max-width: 500px; }
  `]
})
export class InvitationsDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<InvitationsDialogComponent>);
  private invitationService = inject(InvitationService);
  private snackBar = inject(MatSnackBar);

  emails$!: Observable<AuthorizedEmail[]>;
  newEmail: string = '';
  isAdding = false;

  ngOnInit() {
    this.emails$ = this.invitationService.getAuthorizedEmails();
  }

  async addEmail() {
    if (!this.newEmail || !this.newEmail.includes('@')) return;

    this.isAdding = true;
    try {
      await this.invitationService.inviteEmail(this.newEmail);
      this.snackBar.open('¡Invitación enviada con éxito!', 'OK', { duration: 3000 });
      this.newEmail = '';
    } catch (error) {
      this.snackBar.open('Hubo un error al invitar.', 'REINTENTAR');
    } finally {
      this.isAdding = false;
    }
  }

  async removeEmail(id: string) {
    if (confirm('¿Estás seguro de revocar el acceso a este docente?')) {
      try {
        await this.invitationService.revokeEmail(id);
        this.snackBar.open('Acceso revocado.', 'OK', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Error al revocar acceso.', 'OK');
      }
    }
  }
}
