import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';

export const ROUTES: Routes = [
  {
    path: 'login',
    children: [{ path: '', component: LoginComponent, outlet: 'login' }],
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(ROUTES)],
})
export class AuthRoutingModule {}
