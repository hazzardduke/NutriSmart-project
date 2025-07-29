import { TestBed } from '@angular/core/testing';

import { GoalsNutricionistService } from './goals-nutricionist.service';

describe('GoalsNutricionistService', () => {
  let service: GoalsNutricionistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoalsNutricionistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
