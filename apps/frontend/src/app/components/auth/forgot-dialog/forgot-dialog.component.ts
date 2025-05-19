import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { passwordMatchValidator } from '../../../validators/password-match.validator';
import { digitsOnlyValidator } from '../../../validators/digits-only.validator';

@Component({
  selector: 'app-forgot-dialog',
  imports: [DialogModule, ReactiveFormsModule, CommonModule],
  templateUrl: './forgot-dialog.component.html',
  styleUrl: './forgot-dialog.component.css',
})
export class ForgotDialogComponent {
  @Output() navigate = new EventEmitter<'login' | 'register' | 'forgot'>();
  @Output() close = new EventEmitter<void>();

  simplePasswordRegex = /^(?=.*[A-Z]).{8,}$/;

  step: 'identify' | 'verify' | 'reset' = 'identify';

  identifyForm: FormGroup;
  codeForm: FormGroup;
  resetForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.identifyForm = this.fb.group({
      identifier: ['', Validators.required],
    });

    this.codeForm = this.fb.group({
      code: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          digitsOnlyValidator(),
        ],
      ],
    });

    this.resetForm = this.fb.group(
      {
        newPassword: [
          '',
          Validators.required,
          Validators.pattern(this.simplePasswordRegex),
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: passwordMatchValidator('newPassword', 'confirmPassword'),
      }
    );
  }

  submitIdentifier() {
    if (this.identifyForm.valid) {
      // TODO: send code to backend
      this.step = 'verify';
    } else {
      this.identifyForm.markAllAsTouched();
    }
  }

  submitCode() {
    if (this.codeForm.valid) {
      // TODO: validate code
      this.step = 'reset';
    } else {
      this.codeForm.markAllAsTouched();
    }
  }

  submitResetPassword() {
    if (this.resetForm.valid) {
      const { newPassword, confirmPassword } = this.resetForm.value;
      if (newPassword !== confirmPassword) {
        this.resetForm.get('confirmPassword')?.setErrors({ mismatch: true });
        return;
      }
      // TODO: call backend to reset password
      alert('Password successfully reset!');
    } else {
      this.resetForm.markAllAsTouched();
    }
  }

  allowOnlyDigits(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  resetFlow() {
    this.step = 'identify';

    this.identifyForm.reset();
    this.codeForm.reset();
    this.resetForm.reset();
  }

  goToLogin() {
    this.resetFlow();
    this.navigate.emit('login');
  }

  closeModal() {
    this.resetFlow();
    this.close.emit();
  }
}
