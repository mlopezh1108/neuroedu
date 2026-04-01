import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Auth } from '@angular/fire/auth';

export interface AuthorizedEmail {
  id?: string;
  email: string;
  addedBy: string;
  addedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /**
   * Obtiene un stream en tiempo real de correos autorizados
   */
  getAuthorizedEmails(): Observable<AuthorizedEmail[]> {
    const authRef = collection(this.firestore, 'authorized_emails');
    return new Observable<AuthorizedEmail[]>(observer => {
      const unsubscribe = onSnapshot(authRef, (snapshot) => {
        const emails = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            addedAt: (data['addedAt'] as Timestamp).toDate()
          } as AuthorizedEmail;
        });
        observer.next(emails);
      });
      return () => unsubscribe();
    });
  }

  /**
   * Agrega un nuevo correo a la lista blanca
   */
  async inviteEmail(email: string) {
    const currentUser = this.auth.currentUser;
    const authRef = collection(this.firestore, 'authorized_emails');
    
    return addDoc(authRef, {
      email: email.toLowerCase().trim(),
      addedBy: currentUser?.email || 'System',
      addedAt: Timestamp.now()
    });
  }

  /**
   * Revoca la autorización de un correo
   */
  async revokeEmail(docId: string) {
    const docRef = doc(this.firestore, `authorized_emails/${docId}`);
    return deleteDoc(docRef);
  }
}
