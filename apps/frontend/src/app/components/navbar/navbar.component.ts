import {
  Component,
  EventEmitter,
  Output,
  HostListener,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { LoginDialogComponent } from '../auth/login-dialog/login-dialog.component';
import { RegisterDialogComponent } from '../auth/register-dialog/register-dialog.component';
import { ForgotDialogComponent } from '../auth/forgot-dialog/forgot-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    BadgeModule,
    OverlayBadgeModule,
    LoginDialogComponent,
    RegisterDialogComponent,
    ForgotDialogComponent,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  constructor(private renderer: Renderer2) {}

  @Output() menuClicked = new EventEmitter<void>();

  authModal: 'login' | 'register' | 'forgot' | null = 'login';

  openModal(type: 'login' | 'register' | 'forgot') {
    this.authModal = type;
  }

  closeModal() {
    this.authModal = null;
  }

  triggerMenu() {
    this.menuClicked.emit();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const navbar = document.getElementById('navbar');

    if (window.scrollY > 50) {
      this.renderer.removeClass(navbar, 'bg-transparent');
      this.renderer.addClass(navbar, 'bg-mugen-gray/40');
    } else {
      this.renderer.removeClass(navbar, 'bg-mugen-gray/40');
      this.renderer.addClass(navbar, 'bg-transparent');
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEsc() {
    if (this.authModal !== null) {
      this.closeModal();
    }
  }

  isLoggedIn = true;
}
