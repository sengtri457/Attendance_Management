import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceStatsComponent } from './attendance-stats.component';

describe('AttendanceStatsComponent', () => {
  let component: AttendanceStatsComponent;
  let fixture: ComponentFixture<AttendanceStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
