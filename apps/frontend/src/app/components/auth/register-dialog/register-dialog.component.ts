import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-dialog',
  imports: [DialogModule, ReactiveFormsModule],
  templateUrl: './register-dialog.component.html',
  styleUrl: './register-dialog.component.css',
})
export class RegisterDialogComponent {
  @Output() navigate = new EventEmitter<'login' | 'register' | 'forgot'>();
  @Output() close = new EventEmitter<void>();

  goToLogin() {
    this.navigate.emit('login');
  }

  closeModal() {
    this.close.emit();
  }

  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
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
