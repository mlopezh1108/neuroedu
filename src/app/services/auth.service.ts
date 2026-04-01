import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Observable con el estado del usuario de Firebase
  user$: Observable<User | null> = user(this.auth);

  /**
   * Inicia sesión con el popup de Google
   */
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(this.auth, provider);
      const email = credential.user.email;

      if (email) {
        const isAuthorized = await this.checkAuthorization(email);
        if (isAuthorized) {
          this.router.navigate(['/students']);
        } else {
          // Si no está autorizado, cerramos sesión de inmediato
          await this.logout();
          throw new Error('NOT_AUTHORIZED');
        }
      }
    } catch (error: any) {
      console.error('Error en Login:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión activa
   */
  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }

  /**
   * Verifica si un correo está en la lista blanca de Firestore
   */
  async checkAuthorization(email: string): Promise<boolean> {
    // Caso especial para el desarrollador inicial
    if (email === 'marcoslp36@gmail.com') return true;

    const authRef = collection(this.firestore, 'authorized_emails');
    const q = query(authRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  }
}
