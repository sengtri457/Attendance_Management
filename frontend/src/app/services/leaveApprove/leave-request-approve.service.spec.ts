import { TestBed } from '@angular/core/testing';

import { LeaveRequestApproveService } from './leave-request-approve.service';

describe('LeaveRequestApproveService', () => {
  let service: LeaveRequestApproveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaveRequestApproveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
