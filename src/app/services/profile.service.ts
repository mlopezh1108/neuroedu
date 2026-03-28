import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot, doc, deleteDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface StudentProfile {
  id?: string;
  anonymousId: string;
  sensory: {
    auditory: 'hyper' | 'none' | '';
    visual: 'overwhelmed' | 'none' | '';
  };
  cognitive: {
    visualThinking: boolean;
    verbalThinking: boolean;
    kinestheticThinking: boolean;
    analyticalThinking: boolean;
    holisticThinking: boolean;
    stepByStep: boolean;
    verbalDifficulty: boolean;
  };
  regulation: {
    anticipation: boolean;
    socialStories: boolean;
    moreTime: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private firestore = inject(Firestore);
  private ngZone = inject(NgZone);

  async saveProfile(profileData: StudentProfile) {
    const profilesCollection = collection(this.firestore, 'student_profiles');
    return addDoc(profilesCollection, profileData);
  }

  getProfiles(): Observable<StudentProfile[]> {
    return new Observable<StudentProfile[]>(observer => {
      const profilesCollection = collection(this.firestore, 'student_profiles');
      const unsubscribe = onSnapshot(profilesCollection, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StudentProfile[];
        this.ngZone.run(() => observer.next(data));
      }, (error) => {
        this.ngZone.run(() => observer.error(error));
      });
      return () => unsubscribe();
    });
  }

  async getProfileById(profileId: string) {
    const profileDoc = doc(this.firestore, `student_profiles/${profileId}`);
    const docSnap = await getDoc(profileDoc);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as StudentProfile;
    }
    return null;
  }

  async updateProfile(profileId: string, profileData: Partial<StudentProfile>) {
    const profileDoc = doc(this.firestore, `student_profiles/${profileId}`);
    return updateDoc(profileDoc, profileData);
  }

  async deleteProfile(profileId: string) {
    const profileDoc = doc(this.firestore, `student_profiles/${profileId}`);
    return deleteDoc(profileDoc);
  }
}
