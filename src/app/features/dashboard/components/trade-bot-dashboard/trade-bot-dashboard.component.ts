import { Component, Input } from '@angular/core';
import { DashboardOverview } from '../../dashboard.models';

@Component({
  selector: 'app-trade-bot-dashboard',
  standalone: false,
  templateUrl: './trade-bot-dashboard.component.html',
  styleUrl: './trade-bot-dashboard.component.css'
})
export class TradeBotDashboardComponent {
  @Input() overview: DashboardOverview | null = null;
  @Input() loading = false;
  @Input() error = '';
}
