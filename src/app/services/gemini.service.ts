import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';
import { StudentProfile } from './profile.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
  }

  async generateMaterial(profile: StudentProfile, subject: string, topic: string, subTopic: string, additionalComments: string = ''): Promise<string> {
    if (!environment.geminiApiKey || environment.geminiApiKey === 'TU_API_KEY_AQUI') {
      throw new Error('API Key de Gemini no configurada en environment.ts');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = this.buildPrompt(profile, subject, topic, subTopic, additionalComments);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generando material con Gemini:', error);
      throw error;
    }
  }

  private buildPrompt(profile: StudentProfile, subject: string, topic: string, subTopic: string, additionalComments: string): string {
    let constraints = [];

    // Sensorial constraints
    if (profile.sensory?.auditory === 'hyper') constraints.push("No incluyas actividades que dependan de videos ruidosos, canciones fuertes o ambientes caóticos.");
    if (profile.sensory?.visual === 'overwhelmed') constraints.push("Usa lenguaje estructurado, evita descripciones visuales abrumadoras y divide el material en párrafos cortos y claros además evita usar demasiados emojis.");
    
    // Cognitive constraints
    if (profile.cognitive?.visualThinking) constraints.push("Sugiere la creación de mapas mentales, diagramas o utilizar imágenes concretas para ilustrar los conceptos.");
    if (profile.cognitive?.verbalThinking) constraints.push("Estructura la información con explicaciones basadas en lógica, palabras detalladas y listados secuenciales.");
    if (profile.cognitive?.kinestheticThinking) constraints.push("Incluye una actividad empírica, un experimento corto o formas de relacionar el concepto con objetos tocables.");
    if (profile.cognitive?.analyticalThinking) constraints.push("Divide el contenido técnico de forma muy granular y analítica, proporcionando el razonamiento de fondo de por qué funciona.");
    if (profile.cognitive?.holisticThinking) constraints.push("Comienza siempre explicando la imagen general o el resultado final anhelado antes de explicar paso a paso.");
    if (profile.cognitive?.stepByStep) constraints.push("Redacta instrucciones exclusivamente con viñetas numéricas exactas (paso 1, paso 2) muy delimitadas.");
    if (profile.cognitive?.verbalDifficulty) constraints.push("Simplifica el vocabulario. Usa oraciones cortas. Ve al grano sin metáforas complejas ni dobles sentidos.");

    // Regulation constraints
    if (profile.regulation?.anticipation) constraints.push("Agrega al principio un índice muy claro de lo que se va a aprender hoy paso a paso.");
    if (profile.regulation?.socialStories) constraints.push("Usa una historia introductoria cortita y predecible de un personaje para contextualizar la lección.");
    if (profile.regulation?.moreTime) constraints.push("Divide los bloques de trabajo en partes más pequeñas con sugerencias de descansos temporizados.");

    const joinedConstraints = constraints.length > 0 
      ? constraints.map(c => `- ${c}`).join('\n')
      : "Ninguna particularidad estricta requerida para este alumno.";

    return `
Eres un asistente experto en educación y neurodiversidad. 
Tu objetivo es generar material didáctico adaptado al estudiante.

Materia: ${subject}
Tema a explicar: ${topic}
${subTopic ? `Subtema Específico: ${subTopic}` : ''}
${additionalComments.trim() ? `\n### COMENTARIOS EXTRA DEL DOCENTE:\n${additionalComments.trim()}\n` : ''}
### RESTRICCIONES Y ADAPTACIONES PARA EL ALUMNO:
${joinedConstraints}

### FORMATO DE SALIDA ESPERADO:
El resultado final debe incluir:
1. Una introducción amigable adaptada.
2. La explicación clara del concepto.
3. Una (1) actividad adaptada.
Escribe en idioma Español de manera constructiva y empática. No incluyas intros innecesarias. Emite directamente el contenido estructurado en markdown.

### REQUISITOS DE FUENTES ALGORÍTMICAS:
IMPORTANTE: Consulta de manera exclusiva fuentes académicas y científicas fidedignas para fundamentar la lección.
Al final del documento, genera obligatoriamente una sección "## Bibliografía" listando las 3 o 4 referencias utilizadas o recomendadas, rigurosamente en formato APA (7ma edición).
`;
  }
}
