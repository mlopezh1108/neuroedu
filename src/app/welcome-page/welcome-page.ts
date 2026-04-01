import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TutorialService } from '../services/tutorial.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  tutorial = inject(TutorialService);
  public authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  isLoggingIn = false;

  async login() {
    this.isLoggingIn = true;
    try {
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      if (error.message === 'NOT_AUTHORIZED') {
        this.snackBar.open('Acceso denegado: Tu correo no tiene una invitación activa.', 'CERRAR', { duration: 5000 });
      } else {
        this.snackBar.open('Error al intentar iniciar sesión con Google.', 'OK');
      }
    } finally {
      this.isLoggingIn = false;
    }
  }
}
