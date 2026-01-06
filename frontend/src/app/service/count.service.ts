import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { sign } from 'crypto';
@Injectable({
  providedIn: 'root',
})
export class CountService {
  count: number = 0;
  isTrue: boolean = false;
  isclass: boolean = false;
  countParam: number = 0;
  private platformId = inject(PLATFORM_ID);
  getCount(c: number) {
    this.count = c;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('count', JSON.stringify(this.count));
    }
    this.isTrue = true;
    this.isclass = true;
  }
  refresh() {
    window.location.reload();
  }
}
