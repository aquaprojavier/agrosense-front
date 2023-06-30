import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TempHumChartComponent } from './temp-hum-chart.component';

describe('TempHumChartComponent', () => {
  let component: TempHumChartComponent;
  let fixture: ComponentFixture<TempHumChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TempHumChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TempHumChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
