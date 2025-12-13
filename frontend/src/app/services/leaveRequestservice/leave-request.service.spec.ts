import { TestBed } from '@angular/core/testing';

import { LeaveRequestService } from './leave-request.service';

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaveRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
