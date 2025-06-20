import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitardonacionPage } from './solicitardonacion.page';

describe('SolicitardonacionPage', () => {
  let component: SolicitardonacionPage;
  let fixture: ComponentFixture<SolicitardonacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitardonacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
