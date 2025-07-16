import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyCardNutricionistComponent } from './loyalty-card-nutricionist.component';

describe('LoyaltyCardNutricionistComponent', () => {
  let component: LoyaltyCardNutricionistComponent;
  let fixture: ComponentFixture<LoyaltyCardNutricionistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyaltyCardNutricionistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoyaltyCardNutricionistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
