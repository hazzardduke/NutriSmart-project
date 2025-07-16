import { TestBed } from '@angular/core/testing';

import { LoyaltyCardNutricionistService } from './loyalty-card-nutricionist.service';

describe('LoyaltyCardNutricionistService', () => {
  let service: LoyaltyCardNutricionistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoyaltyCardNutricionistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
