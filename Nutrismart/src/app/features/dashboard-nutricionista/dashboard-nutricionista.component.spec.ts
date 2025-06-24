import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardNutricionistaComponent } from './dashboard-nutricionista.component';

describe('DashboardNutricionistaComponent', () => {
  let component: DashboardNutricionistaComponent;
  let fixture: ComponentFixture<DashboardNutricionistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNutricionistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardNutricionistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
