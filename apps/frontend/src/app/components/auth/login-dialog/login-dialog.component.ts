import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-dialog',
  imports: [DialogModule, ReactiveFormsModule],
  templateUrl: './login-dialog.component.html',
})
export class LoginDialogComponent {
  @Output() navigate = new EventEmitter<'login' | 'register' | 'forgot'>();
  @Output() close = new EventEmitter<void>();

  goToRegister() {
    this.navigate.emit('register');
  }

  goToForgot() {
    this.navigate.emit('forgot');
  }

  closeModal() {
    this.close.emit();
  }

  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const success = this.authService.login(email, password);

      if (success) {
        this.close.emit();
      } else {
        alert('Invalid credentials');
      }
    }
  }
}
