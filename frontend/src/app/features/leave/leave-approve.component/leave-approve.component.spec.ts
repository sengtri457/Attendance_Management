import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveApproveComponent } from './leave-approve.component';

describe('LeaveApproveComponent', () => {
  let component: LeaveApproveComponent;
  let fixture: ComponentFixture<LeaveApproveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveApproveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveApproveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
