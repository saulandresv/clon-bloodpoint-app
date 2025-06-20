import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PuntosdonacionPage } from './puntosdonacion.page';

describe('PuntosdonacionPage', () => {
  let component: PuntosdonacionPage;
  let fixture: ComponentFixture<PuntosdonacionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PuntosdonacionPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PuntosdonacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
