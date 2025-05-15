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
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    BadgeModule,
    OverlayBadgeModule,
    LoginDialogComponent,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  constructor(private renderer: Renderer2) {}

  @Output() menuClicked = new EventEmitter<void>();

  loginDialog = false;

  openLoginDialog() {
    this.loginDialog = true;
  }

  closeLoginDialog() {
    this.loginDialog = false;
  }

  triggerMenu() {
    this.menuClicked.emit();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const navbar = document.getElementById('navbar');

    if (window.scrollY > 50) {
      this.renderer.removeClass(navbar, 'bg-transparent');
      this.renderer.addClass(navbar, 'bg-mugen-gray/40'); // Change this to any color you prefer
    } else {
      this.renderer.removeClass(navbar, 'bg-mugen-gray/40'); // Change this to any color you prefer
      this.renderer.addClass(navbar, 'bg-transparent');
    }
  }

  isLoggedIn = true;
}
