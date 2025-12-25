import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CountService {
  count: number = 0;
  isTrue: boolean = false;

  getCount(c: number) {
    this.count = c;
    this.isTrue = true;
  }
}
