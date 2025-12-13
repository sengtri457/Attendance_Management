import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkmarkAbsentComponent } from './markmark-absent.component';

describe('MarkmarkAbsentComponent', () => {
  let component: MarkmarkAbsentComponent;
  let fixture: ComponentFixture<MarkmarkAbsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkmarkAbsentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkmarkAbsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
