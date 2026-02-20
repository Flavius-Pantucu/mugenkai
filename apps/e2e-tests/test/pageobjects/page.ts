import { browser } from '@wdio/globals';

/**
 * Base page object shared across all pages.
 */
export default class Page {
  /**
   * Opens an application route, relying on WebdriverIO baseUrl.
   * @param path app route, e.g. '/' or '/home'
   */
  public open(path: string) {
    return browser.url(path);
  }
}
