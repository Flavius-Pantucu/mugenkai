import { browser, $, expect } from '@wdio/globals';
import LoginPage from '../pageobjects/login.page.js';

describe('Mugenkai E2E flows', () => {
  describe('Authentication', () => {
    it('shows validation errors on empty login submit', async () => {
      await LoginPage.open();
      await LoginPage.submitButton.click();

      const usernameError = await $('div=Username is required.');
      const passwordError = await $('div=Password is required.');

      await expect(usernameError).toBeDisplayed();
      await expect(passwordError).toBeDisplayed();
    });

    it('renders register form', async () => {
      await browser.url('/register');

      const usernameInput = await $('#username');
      const emailInput = await $('#email');
      const passwordInput = await $('#password');

      await expect(usernameInput).toBeDisplayed();
      await expect(emailInput).toBeDisplayed();
      await expect(passwordInput).toBeDisplayed();
    });
  });

  describe('Browsing and playback', () => {
    it('renders home page sections', async () => {
      await browser.url('/home');

      const trending = await $('h2=Trending');
      const popular = await $('h2=Popular this week');
      const continueWatching = await $('h2=Continue watching');

      await expect(trending).toBeDisplayed();
      await expect(popular).toBeDisplayed();
      await expect(continueWatching).toBeDisplayed();
    });

    it('renders anime details layout', async () => {
      await browser.url('/anime/demo-anime');

      const title = await $('h1');
      await expect(title).toBeDisplayed();
    });

    it('renders watch page with progress bar and favorite button', async () => {
      await browser.url('/watch/demo-anime/episode/1');

      const videoPlaceholder = await $('div=Video player placeholder (demo-anime · Episode 1)');
      const addToListButton = await $('button=Add to list');

      await expect(videoPlaceholder).toBeDisplayed();
      await expect(addToListButton).toBeClickable();
    });

    it('renders vertical manga reader', async () => {
      await browser.url('/read/demo-manga/chapter/1');

      const header = await $('h1=Vertical reader');
      const firstPage = await $('div=Page 1 placeholder');

      await expect(header).toBeDisplayed();
      await expect(firstPage).toBeDisplayed();
    });
  });

  describe('Profile and admin', () => {
    it('renders profile page', async () => {
      await browser.url('/profile');

      const title = await $('h1=Profile (placeholder)');
      await expect(title).toBeDisplayed();
    });

    it('renders admin dashboard', async () => {
      await browser.url('/admin');

      const title = await $('h1=Admin dashboard (placeholder)');
      await expect(title).toBeDisplayed();
    });
  });
});
