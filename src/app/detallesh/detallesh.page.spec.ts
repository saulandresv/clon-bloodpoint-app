import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleshPage } from './detallesh.page';

describe('DetalleshPage', () => {
  let component: DetalleshPage;
  let fixture: ComponentFixture<DetalleshPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleshPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
