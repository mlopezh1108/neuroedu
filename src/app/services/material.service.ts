import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, Timestamp, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { StudentProfile } from './profile.service';

export interface GeneratedMaterial {
  id?: string;
  profileId: string;
  profileAnonymousId: string;
  title: string;
  subject: string;
  topic: string;
  subTopic: string;
  content: string; // Markdown en crudo
  tags: string[];
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private firestore = inject(Firestore);

  async saveMaterial(material: Omit<GeneratedMaterial, 'id' | 'createdAt'>) {
    const materialsRef = collection(this.firestore, 'generated_materials');
    
    // Convertimos la clase o timestamp antes de guardar
    const dataToSave = {
      ...material,
      createdAt: Timestamp.now()
    };
    
    return addDoc(materialsRef, dataToSave);
  }

  async getMaterialsByProfile(profileId: string): Promise<GeneratedMaterial[]> {
    const materialsRef = collection(this.firestore, 'generated_materials');
    
    // Consulta simple sin OrderBy para evitar requerir Índices Compuestos en la consola de Firebase
    const q = query(materialsRef, where('profileId', '==', profileId));
    const snap = await getDocs(q);
    
    const materials = snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(data['createdAt'])
      } as GeneratedMaterial;
    });

    // Ordenamiento local (del más reciente al más antiguo)
    return materials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteMaterial(materialId: string) {
    const matDoc = doc(this.firestore, `generated_materials/${materialId}`);
    return deleteDoc(matDoc);
  }

  async getAllMaterials(): Promise<GeneratedMaterial[]> {
    const materialsRef = collection(this.firestore, 'generated_materials');
    // Global fetch without profileId query
    const snap = await getDocs(materialsRef);
    
    const materials = snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(data['createdAt'])
      } as GeneratedMaterial;
    });

    return materials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateMaterial(materialId: string, data: Partial<GeneratedMaterial>) {
    const matDoc = doc(this.firestore, `generated_materials/${materialId}`);
    return updateDoc(matDoc, data);
  }

  /**
   * Extrae "etiquetas" (tags) del perfil complejo del alumno
   * para agregarlas como un arreglo de Strings planos al documento
   */
  generateTags(profile: StudentProfile): string[] {
    const tags: string[] = [];

    // Sensitividad
    if (profile.sensory?.auditory === 'hyper') tags.push('Hipersensibilidad Auditiva');
    if (profile.sensory?.visual === 'overwhelmed') tags.push('Sobrecarga Visual');

    // Cognitivo
    if (profile.cognitive?.visualThinking) tags.push('Pensamiento Visual');
    if (profile.cognitive?.verbalThinking) tags.push('Pensamiento Verbal');
    if (profile.cognitive?.kinestheticThinking) tags.push('Pensamiento Cinestésico');
    if (profile.cognitive?.analyticalThinking) tags.push('Pensamiento Analítico');
    if (profile.cognitive?.holisticThinking) tags.push('Pensamiento Holístico');
    if (profile.cognitive?.stepByStep) tags.push('Paso a Paso');
    if (profile.cognitive?.verbalDifficulty) tags.push('Dificultad Verbal');

    // Regulación
    if (profile.regulation?.anticipation) tags.push('Requiere Anticipación');
    if (profile.regulation?.socialStories) tags.push('Historias Sociales');
    if (profile.regulation?.moreTime) tags.push('Tiempo Extra');

    return tags;
  }
}
