import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { driver } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private router = inject(Router);
  
  public startTour() {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      doneBtnText: 'Finalizar',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      steps: [
        {
          element: '#tour-welcome-title',
          popover: {
            title: '¡Bienvenido a NeuroEdu!',
            description: 'Te daremos un recorrido rápido por la plataforma para que aprendas a usar la Inteligencia Artificial a tu favor.',
            side: 'bottom'
          }
        },
        {
          element: '#tour-btn-profile',
          popover: {
            title: 'Paso 1: Perfilar',
            description: 'Todo empieza registrando a tu alumno. Al darle clic aquí iremos al formulario especializado.',
            side: 'top',
            onNextClick: async () => {
              await this.router.navigate(['/profile']);
              setTimeout(() => {
                driverObj.moveNext();
              }, 400); // Dar tiempo a renderizar
            }
          }
        },
        // --- Perfil Form ---
        {
          element: '#tour-sensory',
          popover: {
            title: 'Perfil Sensorial',
            description: 'Aquí indicas si el alumno tiene sensibilidad al ruido o a la luz. La IA ajustará el formato del material basándose en esto.',
            side: 'bottom'
          }
        },
        {
          element: '#tour-cognitive',
          popover: {
            title: 'Estilo de Pensamiento',
            description: '¿Tu alumno piensa en imágenes o en listas lógicas? Esta data hiper-personaliza las explicaciones didácticas.',
            side: 'top'
          }
        },
        {
          element: '#tour-regulation',
          popover: {
            title: 'Regulación y Anticipación',
            description: 'Si necesita historias sociales o saber qué pasará paso-a-paso, la IA agregará esa capa de anticipación a sus textos.',
            side: 'top',
            onNextClick: async () => {
              await this.router.navigate(['/students']);
              setTimeout(() => {
                driverObj.moveNext();
              }, 400); // Dar tiempo a renderizar la lista
            }
          }
        },
        // --- Student List ---
        {
          element: '#tour-btn-material',
          popover: {
            title: 'Crear Material Mágico',
            description: 'Una vez que tu alumno está guardado, usa este botón para abrir la forja de la IA. ¡Pruébalo luego!',
            side: 'left'
          }
        }
      ]
    });

    driverObj.drive();
  }
}
