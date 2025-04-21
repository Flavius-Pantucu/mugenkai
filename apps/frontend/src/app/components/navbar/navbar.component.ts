import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  @Input() sidenav?: MatSidenav;

  isLoggedIn = false;

  toggleMenu() {
    this.sidenav?.toggle();
  }
}
