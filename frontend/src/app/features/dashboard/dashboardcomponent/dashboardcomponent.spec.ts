import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboardcomponent } from './dashboardcomponent';

describe('Dashboardcomponent', () => {
  let component: Dashboardcomponent;
  let fixture: ComponentFixture<Dashboardcomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboardcomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboardcomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
