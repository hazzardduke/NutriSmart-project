import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminClientsComponent } from './admin-clients.component';

describe('AdminClientsComponent', () => {
  let component: AdminClientsComponent;
  let fixture: ComponentFixture<AdminClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminClientsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
