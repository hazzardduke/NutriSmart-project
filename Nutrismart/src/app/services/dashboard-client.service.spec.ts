import { TestBed } from '@angular/core/testing';

import { DashboardClientService } from './dashboard-client.service';

describe('DashboardClientService', () => {
  let service: DashboardClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
