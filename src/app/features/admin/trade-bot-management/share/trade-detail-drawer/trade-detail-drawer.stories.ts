import type { Meta, StoryObj } from '@storybook/angular';
import { TradeDetailDrawerComponent } from './trade-detail-drawer.component';

const meta: Meta<TradeDetailDrawerComponent> = {
  title: 'Shared/UI/TradeDetailDrawer',
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
