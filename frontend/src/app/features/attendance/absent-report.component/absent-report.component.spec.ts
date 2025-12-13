import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbsentReportComponent } from './absent-report.component';

describe('AbsentReportComponent', () => {
  let component: AbsentReportComponent;
  let fixture: ComponentFixture<AbsentReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbsentReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbsentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
