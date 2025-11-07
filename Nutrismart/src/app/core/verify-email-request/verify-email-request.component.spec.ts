import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyEmailRequestComponent } from './verify-email-request.component';

describe('VerifyEmailRequestComponent', () => {
  let component: VerifyEmailRequestComponent;
  let fixture: ComponentFixture<VerifyEmailRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmailRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyEmailRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
