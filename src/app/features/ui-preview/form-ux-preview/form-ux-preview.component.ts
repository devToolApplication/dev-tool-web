import { Component } from '@angular/core';

interface RuleConditionPreview {
  left: string;
  operator: string;
  right: string;
}

@Component({
  selector: 'app-form-ux-preview',
  standalone: false,
  templateUrl: './form-ux-preview.component.html',
  styleUrl: './form-ux-preview.component.css'
})
export class FormUxPreviewComponent {
  readonly sections = ['Thông tin', 'Cấu hình', 'Quản trị rủi ro', 'Nâng cao'];
  activeSection = 'Cấu hình';

  readonly ruleConditions: RuleConditionPreview[] = [
    { left: 'MACD', operator: 'CROSSOVER', right: 'Close Price' },
    { left: 'Bollinger Bands Low', operator: 'CROSSUNDER', right: 'Close Price' },
    { left: 'Volume', operator: 'GREATER THAN', right: '20' }
  ];

  readonly principles = [
    { icon: 'pi pi-eye', title: 'Tối giản', description: 'Chỉ hiển thị hành động cần cho tác vụ hiện tại.' },
    { icon: 'pi pi-bolt', title: 'Tập trung', description: 'Nội dung form là trung tâm, panel phụ mặc định bị ẩn.' },
    { icon: 'pi pi-check-circle', title: 'Nhất quán', description: 'Một pattern cho create, edit, readonly và trạng thái lỗi.' },
    { icon: 'pi pi-compass', title: 'Dễ thao tác', description: 'CTA rõ ràng, footer cố định, lỗi có điều hướng nhanh.' }
  ];

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}
