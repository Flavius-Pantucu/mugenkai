import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-forgot-dialog',
  imports: [],
  templateUrl: './forgot-dialog.component.html',
  styleUrl: './forgot-dialog.component.css',
})
export class ForgotDialogComponent {
  @Output() navigate = new EventEmitter<'login' | 'register' | 'forgot'>();
  @Output() close = new EventEmitter<void>();

  goToLogin() {
    this.navigate.emit('login');
  }

  closeModal() {
    this.close.emit();
  }
}
