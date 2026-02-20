import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RegisterDialogComponent } from '../../components/auth/register-dialog/register-dialog.component';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, RouterModule, RegisterDialogComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.css',
})
export class RegisterPage {}

