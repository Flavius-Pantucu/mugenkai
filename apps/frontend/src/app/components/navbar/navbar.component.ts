import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  @Output() menuClicked = new EventEmitter<void>();

  triggerMenu() {
    this.menuClicked.emit();
  }

  isLoggedIn = false;
}
