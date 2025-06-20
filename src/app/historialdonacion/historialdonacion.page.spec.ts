import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialdonacionPage } from './historialdonacion.page';

describe('HistorialdonacionPage', () => {
  let component: HistorialdonacionPage;
  let fixture: ComponentFixture<HistorialdonacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialdonacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
