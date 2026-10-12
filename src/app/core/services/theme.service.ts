import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'policygpt-theme';
  private readonly platformId = inject(PLATFORM_ID);

  private transitionTimer: any = null;

  readonly currentTheme = signal<Theme>('light');
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        this.applyTheme(savedTheme, false);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyTheme(prefersDark ? 'dark' : 'light', false);
      }
    }
  }

  toggleTheme(): void {
    const nextTheme: Theme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(theme: Theme): void {
    this.applyTheme(theme, true);
  }

  private applyTheme(theme: Theme, animate = false): void {
    this.currentTheme.set(theme);
    this.isDarkMode.set(theme === 'dark');

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, theme);
      const root = document.documentElement;

      if (animate) {
        root.classList.add('theme-transitioning');
        if (this.transitionTimer) {
          clearTimeout(this.transitionTimer);
        }
        this.transitionTimer = setTimeout(() => {
          root.classList.remove('theme-transitioning');
          this.transitionTimer = null;
        }, 450);
      }

      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-theme');
      } else {
        root.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-theme');
      }
    }
  }
}
