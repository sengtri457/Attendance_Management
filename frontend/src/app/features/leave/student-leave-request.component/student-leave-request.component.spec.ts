import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentLeaveRequestComponent } from './student-leave-request.component';

describe('StudentLeaveRequestComponent', () => {
  let component: StudentLeaveRequestComponent;
  let fixture: ComponentFixture<StudentLeaveRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentLeaveRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentLeaveRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
