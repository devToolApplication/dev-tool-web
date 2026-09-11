import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { QuantEquityPointDto } from '../../models/quant-backtest.dto';
import { EquityChartComponent } from './equity-chart.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): string {
    return String(value ?? '');
  }
}

describe('EquityChartComponent', () => {
  let component: EquityChartComponent;
  let fixture: ComponentFixture<EquityChartComponent>;

  const mockPoints: QuantEquityPointDto[] = [
    {
      runId: 'quant-run-1',
      timestamp: '2026-01-01T00:00:00Z',
      equity: 100000,
      cash: 100000,
      drawdown: 0,
    },
    {
      runId: 'quant-run-1',
      timestamp: '2026-01-15T00:00:00Z',
      equity: 108000,
      cash: 108000,
      drawdown: -0.005,
    },
    {
      runId: 'quant-run-1',
      timestamp: '2026-01-31T23:59:00Z',
      equity: 114850,
      cash: 114850,
      drawdown: 0,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EquityChartComponent, TranslateContentPipeStub],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EquityChartComponent);
    component = fixture.componentInstance;
  });

  it('creates the component and computes accessible summary text', () => {
    expect(component).toBeTruthy();
    expect(component.summaryText).toContain('quantBacktest.detail.chart.noPoints');

    component.points = mockPoints;
    expect(component.summaryText).toContain('quantBacktest.detail.chart.points: 3');
    expect(component.summaryText).toContain('quantBacktest.detail.chart.endingEquity: 114,850');
  });

  it('uses shared TableConfig for accessible equity data', () => {
    expect(component.tableConfig.pagination).toBe(false);
    expect(component.tableConfig.columns.map((column) => column.field)).toEqual([
      'timestamp',
      'equity',
      'cash',
      'drawdown',
    ]);
  });

  it('toggles the accessible data table', () => {
    expect(component.showDataTable()).toBe(false);
    component.toggleDataTable();
    expect(component.showDataTable()).toBe(true);
    component.toggleDataTable();
    expect(component.showDataTable()).toBe(false);
  });
});
