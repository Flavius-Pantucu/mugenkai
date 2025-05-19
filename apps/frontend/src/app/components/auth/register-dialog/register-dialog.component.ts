import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { passwordMatchValidator } from '../../../validators/password-match.validator';

@Component({
  selector: 'app-register-dialog',
  imports: [DialogModule, ReactiveFormsModule, CommonModule],
  templateUrl: './register-dialog.component.html',
  styleUrl: './register-dialog.component.css',
})
export class RegisterDialogComponent {
  @Output() navigate = new EventEmitter<'login' | 'register' | 'forgot'>();
  @Output() close = new EventEmitter<void>();

  registerForm: FormGroup;
  simplePasswordRegex = /^(?=.*[A-Z]).{8,}$/;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(20),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          Validators.required,
          Validators.pattern(this.simplePasswordRegex),
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: passwordMatchValidator('password', 'confirmPassword'),
      }
    );
  }

  goToLogin() {
    this.navigate.emit('login');
  }

  closeModal() {
    this.close.emit();
  }

  submit() {
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;
      const success = this.authService.login(email, password);

      if (success) {
        this.close.emit();
      } else {
        alert('Invalid credentials');
      }
    }
  }
}
