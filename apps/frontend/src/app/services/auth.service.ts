import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedIn = false;

  login(email: string, password: string): boolean {
    if (email === 'admin@example.com' && password === 'admin') {
      this.isLoggedIn = true;
      return true;
    }
    return false;
  }

  logout(): void {
    this.isLoggedIn = false;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}
