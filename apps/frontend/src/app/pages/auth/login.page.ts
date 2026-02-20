import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginDialogComponent } from '../../components/auth/login-dialog/login-dialog.component';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, RouterModule, LoginDialogComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {}

