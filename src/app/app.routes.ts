import { Routes } from '@angular/router';
import { ProfileForm } from './profile-form/profile-form';
import { WelcomePage } from './welcome-page/welcome-page';
import { StudentList } from './student-list/student-list';
import { MaterialEditor } from './material-editor/material-editor';
import { LibraryPage } from './library/library';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: WelcomePage },
  { path: 'profile', component: ProfileForm, canActivate: [authGuard] },
  { path: 'profile/:id', component: ProfileForm, canActivate: [authGuard] },
  { path: 'students', component: StudentList, canActivate: [authGuard] },
  { path: 'material-editor', component: MaterialEditor, canActivate: [authGuard] },
  { path: 'biblioteca', component: LibraryPage, canActivate: [authGuard] }
];
