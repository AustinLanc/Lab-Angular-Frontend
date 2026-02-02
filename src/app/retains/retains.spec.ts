import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Retains } from './retains';

describe('Retains', () => {
  let component: Retains;
  let fixture: ComponentFixture<Retains>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Retains]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Retains);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
