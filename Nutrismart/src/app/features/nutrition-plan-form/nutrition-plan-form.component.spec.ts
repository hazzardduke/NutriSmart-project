import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutritionPlanFormComponent } from './nutrition-plan-form.component';

describe('NutritionPlanFormComponent', () => {
  let component: NutritionPlanFormComponent;
  let fixture: ComponentFixture<NutritionPlanFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionPlanFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritionPlanFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
