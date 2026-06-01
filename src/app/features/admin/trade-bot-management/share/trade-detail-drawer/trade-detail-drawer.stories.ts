import type { Meta, StoryObj } from '@storybook/angular';
import { TradeDetailDrawerComponent } from './trade-detail-drawer.component';

const meta: Meta<TradeDetailDrawerComponent> = {
  title: 'Features/Trade Bot/Trade Detail Drawer',
  component: TradeDetailDrawerComponent,
  args: {
    trade: {
      id: '1',
      runId: 'RUN_1',
      tradeId: 'T-1',
      symbol: 'BTCUSDT',
      timeframe: '1m',
      side: 'BUY',
      entryIndex: 10,
      exitIndex: 18,
      entryPrice: 100,
      exitPrice: 108,
      stopLoss: 95,
      takeProfit: 110,
      quantity: 1,
      riskAmount: 50,
      pnl: 8,
      exitReason: 'TAKE_PROFIT'
    },
    orders: [{ orderId: 'O-1', tradeId: 'T-1', status: 'FILLED', type: 'ENTRY', price: 100 }],
    events: [{ id: 'E-1', runId: 'RUN_1', barIndex: 10, eventTime: '2026-01-01T00:10:00Z', type: 'ENTRY', message: 'Trade T-1 opened', data: { tradeId: 'T-1' } }],
    trace: { ruleCode: 'ENTRY', passed: true }
  }
};

export default meta;

type Story = StoryObj<TradeDetailDrawerComponent>;

export const Default: Story = {};

export const LossTrade: Story = {
  args: {
    trade: {
      id: '2',
      runId: 'RUN_2',
      tradeId: 'T-2',
      symbol: 'ETHUSDT',
      timeframe: '5m',
      side: 'BUY',
      entryIndex: 5,
      exitIndex: 12,
      entryPrice: 3200,
      exitPrice: 3050,
      stopLoss: 3050,
      takeProfit: 3400,
      quantity: 0.5,
      riskAmount: 75,
      pnl: -75,
      exitReason: 'STOP_LOSS'
    },
    orders: [
      { orderId: 'O-2', tradeId: 'T-2', status: 'FILLED', type: 'ENTRY', price: 3200 },
      { orderId: 'O-3', tradeId: 'T-2', status: 'FILLED', type: 'EXIT', price: 3050 }
    ],
    events: [
      { id: 'E-2', runId: 'RUN_2', barIndex: 5, eventTime: '2026-01-01T00:05:00Z', type: 'ENTRY', message: 'Trade T-2 opened', data: { tradeId: 'T-2' } },
      { id: 'E-3', runId: 'RUN_2', barIndex: 12, eventTime: '2026-01-01T00:12:00Z', type: 'EXIT', message: 'Trade T-2 stopped out', data: { tradeId: 'T-2' } }
    ],
    trace: { ruleCode: 'ENTRY', passed: true }
  }
};

export const EmptyOrders: Story = {
  args: {
    trade: {
      id: '3',
      runId: 'RUN_3',
      tradeId: 'T-3',
      symbol: 'BTCUSDT',
      timeframe: '1m',
      side: 'SELL',
      entryIndex: 20,
      exitIndex: undefined,
      entryPrice: 65000,
      exitPrice: undefined,
      stopLoss: 66000,
      takeProfit: 63000,
      quantity: 0.01,
      riskAmount: 10,
      pnl: undefined,
      exitReason: undefined
    },
    orders: [],
    events: [],
    trace: undefined
  }
};
