import { Routes } from '@angular/router';
import { ProfileForm } from './profile-form/profile-form';
import { WelcomePage } from './welcome-page/welcome-page';
import { StudentList } from './student-list/student-list';
import { MaterialEditor } from './material-editor/material-editor';
import { LibraryPage } from './library/library';

export const routes: Routes = [
  { path: '', component: WelcomePage },
  { path: 'profile', component: ProfileForm },
  { path: 'profile/:id', component: ProfileForm },
  { path: 'students', component: StudentList },
  { path: 'material-editor', component: MaterialEditor },
  { path: 'biblioteca', component: LibraryPage }
];
