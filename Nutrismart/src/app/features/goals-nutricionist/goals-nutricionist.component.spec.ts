import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalsNutricionistComponent } from './goals-nutricionist.component';

describe('GoalsNutricionistComponent', () => {
  let component: GoalsNutricionistComponent;
  let fixture: ComponentFixture<GoalsNutricionistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalsNutricionistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoalsNutricionistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
