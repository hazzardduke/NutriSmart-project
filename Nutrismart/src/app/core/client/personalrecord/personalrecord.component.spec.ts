import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalrecordComponent } from './personalrecord.component';

describe('PersonalrecordComponent', () => {
  let component: PersonalrecordComponent;
  let fixture: ComponentFixture<PersonalrecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalrecordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalrecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
