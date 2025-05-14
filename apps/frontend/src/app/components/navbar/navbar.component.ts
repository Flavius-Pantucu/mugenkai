import {
  Component,
  EventEmitter,
  Output,
  HostListener,
  Renderer2,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, BadgeModule, OverlayBadgeModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  constructor(private renderer: Renderer2) {}

  @Output() menuClicked = new EventEmitter<void>();

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
