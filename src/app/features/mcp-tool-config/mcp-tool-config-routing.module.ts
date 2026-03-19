import { Routes } from '@angular/router';
import { McpToolFormComponent } from './form/mcp-tool-form.component';
import { McpToolListComponent } from './list/mcp-tool-list.component';

export const mcpToolConfigRoutes: Routes = [
  { path: 'admin/mcp-tool-config', redirectTo: 'admin/mcp-tool-config/tool', pathMatch: 'full' },
  {
    path: 'admin/mcp-tool-config/tool',
    children: [
      { path: '', component: McpToolListComponent },
      { path: 'create', component: McpToolFormComponent },
      { path: 'edit/:id', component: McpToolFormComponent }
    ]
  }
];
