import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutriScheduleComponent } from './nutri-schedule.component';

describe('NutriScheduleComponent', () => {
  let component: NutriScheduleComponent;
  let fixture: ComponentFixture<NutriScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutriScheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutriScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
