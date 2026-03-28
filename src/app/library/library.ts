import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MaterialService, GeneratedMaterial } from '../services/material.service';
import { ProfileService } from '../services/profile.service';
import { MaterialViewDialog } from './material-view-dialog';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './library.html',
  styleUrl: './library.css'
})
export class LibraryPage implements OnInit, AfterViewInit {
  private materialService = inject(MaterialService);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  displayedColumns: string[] = ['title', 'subject', 'topic', 'subTopic', 'tags', 'actions'];
  dataSource = new MatTableDataSource<GeneratedMaterial>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  async ngOnInit() {
    await this.loadMaterials();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadMaterials() {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const materials = await this.materialService.getAllMaterials();
      this.dataSource.data = materials;
    } catch (error) {
      console.error('Error cargando biblioteca:', error);
      this.snackBar.open('Error al cargar la biblioteca de materiales', 'OK');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  viewMaterial(material: GeneratedMaterial) {
    this.dialog.open(MaterialViewDialog, {
      data: { content: material.content, title: material.title },
      width: '90vw',
      maxWidth: '1000px',
      maxHeight: '90vh'
    });
  }

  async editMaterial(material: GeneratedMaterial) {
    // Para editar necesitamos el Profile completo. Lo buscamos.
    try {
      const profile = await this.profileService.getProfileById(material.profileId);
      if (profile) {
        this.router.navigate(['/material-editor'], {
          state: {
            materialId: material.id,
            content: material.content,
            profile: profile,
            subject: material.subject,
            topic: material.topic,
            subTopic: material.subTopic
          }
        });
      } else {
        this.snackBar.open('No se encontró el perfil asociado a este material.', 'OK');
      }
    } catch (error) {
      this.snackBar.open('Error al preparar la edición.', 'OK');
    }
  }

  async deleteMaterial(material: GeneratedMaterial) {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${material.title}"?`)) {
      try {
        await this.materialService.deleteMaterial(material.id!);
        this.snackBar.open('Material eliminado', 'OK', { duration: 3000 });
        await this.loadMaterials(); // Recargar la tabla
      } catch (error) {
        this.snackBar.open('Error al eliminar material', 'OK');
      }
    }
  }
}
