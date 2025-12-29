import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CountService {
  count: number = 0;
  isTrue: boolean = false;
  isclass: boolean = false;
  countParam: number = 0;
  getCount(c: number) {
    this.count = c;
    this.isTrue = true;
    this.isclass = true;
  }
  refresh() {
    window.location.reload();
  }
}
