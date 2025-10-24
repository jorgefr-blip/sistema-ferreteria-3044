import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentasZonaComponent } from './ventas-zona-component';

describe('VentasZonaComponent', () => {
  let component: VentasZonaComponent;
  let fixture: ComponentFixture<VentasZonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasZonaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentasZonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
