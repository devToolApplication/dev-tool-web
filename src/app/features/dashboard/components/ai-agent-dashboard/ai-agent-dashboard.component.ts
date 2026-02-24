import { Component, Input } from '@angular/core';
import { DashboardItem } from '../../dashboard.models';

@Component({
  selector: 'app-ai-agent-dashboard',
  standalone: false,
  templateUrl: './ai-agent-dashboard.component.html',
  styleUrl: './ai-agent-dashboard.component.css'
})
export class AiAgentDashboardComponent {
  @Input() items: DashboardItem[] = [];
}
