import { Component, EventEmitter, Output } from '@angular/core';
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
  @Output() menuClicked = new EventEmitter<void>();

  triggerMenu() {
    this.menuClicked.emit();
  }

  isLoggedIn = true;
}
