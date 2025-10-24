import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopVendedoresComponent } from './top-vendedores-component';

describe('TopVendedoresComponent', () => {
  let component: TopVendedoresComponent;
  let fixture: ComponentFixture<TopVendedoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopVendedoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopVendedoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
