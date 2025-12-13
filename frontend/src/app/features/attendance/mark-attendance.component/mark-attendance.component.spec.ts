import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkAttendanceComponent } from './mark-attendance.component';

describe('MarkAttendanceComponent', () => {
  let component: MarkAttendanceComponent;
  let fixture: ComponentFixture<MarkAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkAttendanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
