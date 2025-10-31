import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthVerifyComponent } from './auth-verify.component';

describe('AuthVerifyComponent', () => {
  let component: AuthVerifyComponent;
  let fixture: ComponentFixture<AuthVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthVerifyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
