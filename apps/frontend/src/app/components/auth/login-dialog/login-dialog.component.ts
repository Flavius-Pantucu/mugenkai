import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-dialog',
  imports: [DialogModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login-dialog.component.html',
})
export class LoginDialogComponent {
  @Output() navigate = new EventEmitter<'login' | 'register' | 'forgot'>();
  @Output() close = new EventEmitter<void>();

  loginForm: FormGroup;
  simplePasswordRegex = /^(?=.*[A-Z]).{8,}$/;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
        ],
      ],
      password: [
        '',
        [Validators.required, Validators.pattern(this.simplePasswordRegex)],
      ],
    });
  }

  goToRegister() {
    this.navigate.emit('register');
  }

  goToForgot() {
    this.navigate.emit('forgot');
  }

  closeModal() {
    this.close.emit();
  }

  submit() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      const success = this.authService.login(username, password);

      if (success) {
        this.close.emit();
      } else {
        alert('Invalid credentials');
      }
    }
  }
}
