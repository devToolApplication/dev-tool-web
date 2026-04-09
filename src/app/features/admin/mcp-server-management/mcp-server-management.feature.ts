import { Routes } from '@angular/router';
import { McpCategoryFormComponent } from './mcp-category/form/mcp-category-form.component';
import { McpCategoryListComponent } from './mcp-category/list/mcp-category-list.component';
import { McpToolFormComponent } from './mcp-tool/form/mcp-tool-form.component';
import { McpToolListComponent } from './mcp-tool/list/mcp-tool-list.component';

export const MCP_SERVER_FEATURE_COMPONENTS = [
  McpToolListComponent,
  McpToolFormComponent,
  McpCategoryListComponent,
  McpCategoryFormComponent
];

export const mcpServerRoutes: Routes = [
  { path: 'admin/mcp-tool-config', redirectTo: 'admin/mcp-tool-config/tool', pathMatch: 'full' },
  {
    path: 'admin/mcp-tool-config/category',
    children: [
      { path: '', component: McpCategoryListComponent },
      { path: 'create', component: McpCategoryFormComponent },
      { path: 'edit/:id', component: McpCategoryFormComponent }
    ]
  },
  {
    path: 'admin/mcp-tool-config/tool',
    children: [
      { path: '', component: McpToolListComponent },
      { path: 'create', component: McpToolFormComponent },
      { path: 'edit/:id', component: McpToolFormComponent }
    ]
  }
];
