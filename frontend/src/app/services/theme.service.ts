import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(false);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      // Check local storage or system preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.darkMode.set(savedTheme === 'dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.darkMode.set(prefersDark);
      }
    }

    // Apply theme whenever it changes
    effect(() => {
      const isDark = this.darkMode();
      if (this.isBrowser) {
        if (isDark) {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.setAttribute('data-bs-theme', 'dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
          document.documentElement.setAttribute('data-bs-theme', 'light');
          localStorage.setItem('theme', 'light');
        }
      }
    });
  }

  toggleTheme() {
    this.darkMode.update(current => !current);
  }
}
