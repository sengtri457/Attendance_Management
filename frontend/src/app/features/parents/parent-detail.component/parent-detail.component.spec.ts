import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentDetailComponent } from './parent-detail.component';

describe('ParentDetailComponent', () => {
  let component: ParentDetailComponent;
  let fixture: ComponentFixture<ParentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
