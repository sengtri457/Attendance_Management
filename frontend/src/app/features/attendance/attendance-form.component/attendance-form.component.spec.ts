import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceFormComponent } from './attendance-form.component';

describe('AttendanceFormComponent', () => {
  let component: AttendanceFormComponent;
  let fixture: ComponentFixture<AttendanceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
