import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyCardClientComponent } from './loyalty-card-client.component';

describe('LoyaltyCardClientComponent', () => {
  let component: LoyaltyCardClientComponent;
  let fixture: ComponentFixture<LoyaltyCardClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyaltyCardClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoyaltyCardClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
