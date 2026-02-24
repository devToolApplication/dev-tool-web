import { Component, Input } from '@angular/core';
import { DashboardItem } from '../../dashboard.models';

@Component({
  selector: 'app-trade-bot-dashboard',
  standalone: false,
  templateUrl: './trade-bot-dashboard.component.html',
  styleUrl: './trade-bot-dashboard.component.css'
})
export class TradeBotDashboardComponent {
  @Input() items: DashboardItem[] = [];
}
