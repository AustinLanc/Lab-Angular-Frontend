import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Qc } from './qc';

describe('Qc', () => {
  let component: Qc;
  let fixture: ComponentFixture<Qc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Qc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Qc);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
