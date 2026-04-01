import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { InvitationsDialogComponent } from './invitations-dialog/invitations-dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly themeService = inject(ThemeService);
  public readonly authService = inject(AuthService);
  private dialog = inject(MatDialog);

  logout() {
    this.authService.logout();
  }

  openInvitations() {
    this.dialog.open(InvitationsDialogComponent, {
      width: '500px'
    });
  }
}
