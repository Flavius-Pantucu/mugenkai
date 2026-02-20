import { $ } from '@wdio/globals';
import Page from './page.js';

/**
 * Page object for the Mugenkai login experience.
 */
class LoginPage extends Page {
  public get inputUsername() {
    return $('#username');
  }

  public get inputPassword() {
    return $('#password');
  }

  public get submitButton() {
    return $('button[type="submit"]');
  }

  public async login(username: string, password: string) {
    await this.inputUsername.setValue(username);
    await this.inputPassword.setValue(password);
    await this.submitButton.click();
  }

  public open() {
    return super.open('/login');
  }
}

export default new LoginPage();
