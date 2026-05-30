import {
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import {
  DEFAULT_FLOW_CAPABILITIES,
  EMPTY_FLOW_SELECTION,
  FlowDefinition,
  FlowNodeTypeDefinition,
  FlowEdgeTypeDefinition,
  FlowBuilderMode,
  FlowToolbarConfig,
  FlowInspectorConfig,
  FlowPaletteConfig,
  FlowInspectorField,
  FlowValidationIssue,
  FlowConnectEvent,
  FlowNodeDropEvent,
  FlowNode,
  FlowEdge,
  FlowNodeChange,
  FlowEdgeChange,
  FlowCommandEvent,
  FlowCommand,
  FlowCapabilities,
  FlowContextMenuEvent,
  FlowSelection,
  FlowSelectionItem,
} from '../../models';
import { FlowCanvasComponent } from '../flow-canvas/flow-canvas.component';
import { FlowNodeTemplateDirective, FlowInspectorTemplateDirective } from '../../directives/flow-template.directives';
import { FlowDiagramData } from '../../core/flow-diagram-data';
import { FlowHistory } from '../../core/flow-history';
import { areFlowDefinitionsEqual, cloneFlowDefinition, cloneFlowValue } from '../../core/flow-serialization';
import {
  createFlowInspectorNodePatch,
  FlowInspectorFormChange,
} from '../flow-inspector/flow-inspector-form.utils';

type InspectorSelectValue = string | number | boolean | null;
type ActiveFlowContextMenu = FlowContextMenuEvent & { localX: number; localY: number };

@Component({
  selector: 'app-flow-builder',
  standalone: false,
  templateUrl: './flow-builder.component.html',
  styleUrls: ['./flow-builder.component.css'],
})
export class FlowBuilderComponent implements OnChanges {
  @ViewChild(FlowCanvasComponent) canvas!: FlowCanvasComponent;
  @ViewChild('importInput') importInput?: ElementRef<HTMLInputElement>;
  @ContentChildren(FlowNodeTemplateDirective) nodeTemplates!: QueryList<FlowNodeTemplateDirective>;
  @ContentChildren(FlowInspectorTemplateDirective) inspectorTemplates!: QueryList<FlowInspectorTemplateDirective>;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly history = new FlowHistory();

  @Input() value: FlowDefinition | null = null;
  @Input() mode: FlowBuilderMode = 'edit';
  @Input() nodeTypes: FlowNodeTypeDefinition[] | null = [];
  @Input() edgeTypes: FlowEdgeTypeDefinition[] | null = [];
  @Input() toolbar: FlowToolbarConfig | null = { visible: true };
  @Input() inspector: FlowInspectorConfig | null = { visible: true, position: 'right' };
  @Input() palette: FlowPaletteConfig | null = { visible: true };
  @Input() capabilities: FlowCapabilities = {};
  @Input() validationIssues: FlowValidationIssue[] = [];
  @Input() selectedId: string | null = null;
  @Input() selection: FlowSelection = EMPTY_FLOW_SELECTION;
  @Input() autoLayout = true;
  @Input() fitOnLoad = true;
  @Input() readonly = false;

  @Output() readonly valueChange = new EventEmitter<FlowDefinition>();
  @Output() readonly selectedIdChange = new EventEmitter<string | null>();
  @Output() readonly nodeClick = new EventEmitter<FlowNode>();
  @Output() readonly edgeClick = new EventEmitter<FlowEdge>();
  @Output() readonly blankClick = new EventEmitter<void>();
  @Output() readonly nodeChange = new EventEmitter<FlowNodeChange>();
  @Output() readonly edgeChange = new EventEmitter<FlowEdgeChange>();
  @Output() readonly connect = new EventEmitter<FlowConnectEvent>();
  @Output() readonly command = new EventEmitter<FlowCommandEvent>();
  @Output() readonly validationChange = new EventEmitter<FlowValidationIssue[]>();
  @Output() readonly selectionChange = new EventEmitter<FlowSelection>();
  @Output() readonly contextMenu = new EventEmitter<FlowContextMenuEvent>();

  readonly inspectorOpen = signal(true);
  readonly navigatorOpen = signal(true);
  readonly fullscreen = signal(false);
  readonly viewport = signal<import('../../models').FlowViewportSnapshot | null>(null);
  readonly contextMenuState = signal<ActiveFlowContextMenu | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      const current = this.history.current();
      if (!this.value) {
        this.history.reset(null);
      } else if (!current || !areFlowDefinitionsEqual(current, this.value)) {
        this.history.reset(this.value);
      }
    }
  }

  get resolvedMode(): FlowBuilderMode {
    return this.readonly ? 'readonly' : this.mode;
  }

  get resolvedToolbar(): FlowToolbarConfig {
    return this.toolbar ?? { visible: true };
  }

  get resolvedInspector(): FlowInspectorConfig {
    return this.inspector ?? { visible: true, position: 'right' };
  }

  get resolvedNodeTypes(): FlowNodeTypeDefinition[] {
    return this.nodeTypes ?? [];
  }

  get resolvedEdgeTypes(): FlowEdgeTypeDefinition[] {
    return this.edgeTypes ?? [];
  }

  get resolvedCapabilities(): Required<Omit<FlowCapabilities, 'commands'>> & Pick<FlowCapabilities, 'commands'> {
    return {
      ...DEFAULT_FLOW_CAPABILITIES,
      ...(this.resolvedToolbar.capabilities ?? {}),
      ...this.capabilities,
    };
  }

  get resolvedPalette(): FlowPaletteConfig {
    return this.palette ?? { visible: true };
  }

  get selectedIds(): string[] {
    if (this.selection?.items?.length) {
      return this.selection.items.map(item => item.id);
    }
    return this.selectedId ? [this.selectedId] : [];
  }

  get selectedNode(): FlowNode | null {
    if (!this.selectedId || !this.value) return null;
    return this.value.nodes.find(n => n.id === this.selectedId) ?? null;
  }

  get selectedEdge(): FlowEdge | null {
    if (!this.selectedId || !this.value) return null;
    return this.value.edges.find(e => e.id === this.selectedId) ?? null;
  }

  get selectedNodeType(): FlowNodeTypeDefinition | null {
    const node = this.selectedNode;
    if (!node) return null;
    return this.resolvedNodeTypes.find(type => type.type === node.type) ?? null;
  }

  get inspectorTemplate(): FlowInspectorTemplateDirective | null {
    const node = this.selectedNode;
    if (!node) return null;
    return this.inspectorTemplates?.find(t => t.type === node.type) ?? null;
  }

  get hasInspectorSchema(): boolean {
    return !!this.selectedNodeType?.inspector?.sections?.length;
  }

  get hasInspectorForm(): boolean {
    return !!this.selectedNodeType?.inspectorForm?.fields?.length;
  }

  get inspectorTitle(): string {
    const node = this.selectedNode;
    const schema = this.selectedNodeType?.inspector;
    if (!node || !schema?.title) return node?.label ?? node?.type ?? '';
    return typeof schema.title === 'function' ? schema.title(node) : schema.title;
  }

  isCommandVisible(cmd: FlowCommand): boolean {
    return !this.resolvedToolbar.commands?.length || this.resolvedToolbar.commands.includes(cmd);
  }

  isCommandEnabled(cmd: FlowCommand): boolean {
    const commandOverrides = this.resolvedCapabilities.commands;
    if (commandOverrides?.[cmd] === false) return false;

    switch (cmd) {
      case 'undo':
        return this.resolvedMode === 'edit' && !!this.resolvedCapabilities.history && this.history.canUndo();
      case 'redo':
        return this.resolvedMode === 'edit' && !!this.resolvedCapabilities.history && this.history.canRedo();
      case 'autoLayout':
        return !!this.resolvedCapabilities.autoLayout;
      case 'toggleNavigator':
        return !!this.resolvedCapabilities.navigator;
      case 'toggleInspector':
        return !!this.resolvedCapabilities.inspector;
      case 'fullscreen':
        return !!this.resolvedCapabilities.fullscreen;
      case 'deleteSelection':
        return this.resolvedMode === 'edit' && !!this.resolvedCapabilities.deleteSelection && this.selectedIds.length > 0;
      case 'duplicateSelection':
        return this.resolvedMode === 'edit' && !!this.resolvedCapabilities.duplicateSelection && this.selectedIds.length > 0;
      case 'exportJson':
      case 'importJson':
        return !!this.resolvedCapabilities.importExport;
      default:
        return true;
    }
  }

  onNodeClick(nodeId: string): void {
    this.closeContextMenu();
    this.selectSingle({ id: nodeId, kind: 'node' });
    const node = this.value?.nodes.find(n => n.id === nodeId);
    if (node) this.nodeClick.emit(node);
  }

  onViewportChange(snapshot: import('../../models').FlowViewportSnapshot): void {
    this.viewport.set(snapshot);
  }

  onNavigatorViewportPan(event: { centerX: number; centerY: number }): void {
    this.canvas?.engineInstance?.panToLocalCenter(event.centerX, event.centerY);
  }

  onEdgeClick(edgeId: string): void {
    this.closeContextMenu();
    this.selectSingle({ id: edgeId, kind: 'edge' });
    const edge = this.value?.edges.find(e => e.id === edgeId);
    if (edge) this.edgeClick.emit(edge);
  }

  onBlankClick(): void {
    this.closeContextMenu();
    this.clearSelection();
    this.blankClick.emit();
  }

  onConnect(event: FlowConnectEvent): void {
    this.connect.emit(event);
    if (!this.value) return;
    const newEdge: FlowEdge = {
      id: `edge-${event.sourceNodeId}-${event.targetNodeId}-${Date.now().toString(36)}`,
      source: { nodeId: event.sourceNodeId, portId: event.sourcePortId },
      target: { nodeId: event.targetNodeId, portId: event.targetPortId },
    };
    const updated = FlowDiagramData.from(this.value).addEdge(newEdge);
    this.edgeChange.emit({ type: 'add', edge: newEdge });
    this.emitDefinition(updated);
  }

  onContextMenu(event: FlowContextMenuEvent): void {
    if (event.targetType === 'node' && event.targetId) {
      this.selectSingle({ id: event.targetId, kind: 'node' });
    } else if (event.targetType === 'edge' && event.targetId) {
      this.selectSingle({ id: event.targetId, kind: 'edge' });
    }
    this.openContextMenu(event);
    this.contextMenu.emit(event);
  }

  onNodeMove(event: { nodeId: string; x: number; y: number }): void {
    if (!this.value) return;
    const node = this.value.nodes.find(n => n.id === event.nodeId);
    if (!node) return;
    const updatedNode: FlowNode = { ...node, position: { x: event.x, y: event.y } };
    this.nodeChange.emit({ type: 'move', node: updatedNode, previousNode: node });
    const updated = FlowDiagramData.from(this.value).moveNode(event.nodeId, { x: event.x, y: event.y });
    this.emitDefinition(updated);
  }

  onPaletteNodeAdd(nodeType: string): void {
    const position = this.viewportCenter();
    this.addNodeFromType(nodeType, position.x, position.y);
  }

  onNodeDrop(event: FlowNodeDropEvent): void {
    this.addNodeFromType(event.nodeType, event.x, event.y);
  }

  onAddNodeFromPort(event: { sourceNodeId: string; sourcePortId: string; nodeType: string }): void {
    if (!this.value || this.resolvedMode !== 'edit') return;
    const sourceNode = this.value.nodes.find(n => n.id === event.sourceNodeId);
    if (!sourceNode) return;

    const sourcePos = sourceNode.position ?? { x: 0, y: 0 };
    const sourceSize = sourceNode.size ?? { width: 200, height: 70 };
    const newX = sourcePos.x;
    const newY = sourcePos.y + sourceSize.height + 80;

    const typeDef = this.resolvedNodeTypes.find(t => t.type === event.nodeType);
    if (!typeDef) return;

    const size = typeDef.defaultSize ?? { width: 200, height: 70 };
    const newNode: FlowNode = {
      id: this.createNodeId(event.nodeType),
      type: event.nodeType,
      label: typeDef.label,
      size,
      position: { x: Math.round(newX + sourceSize.width / 2 - size.width / 2), y: Math.round(newY) },
      data: typeof typeDef.defaultData === 'function' ? typeDef.defaultData() : { ...(typeDef.defaultData ?? {}) },
    };

    const newEdge: FlowEdge = {
      id: `edge-${event.sourceNodeId}-${newNode.id}-${Date.now().toString(36)}`,
      source: { nodeId: event.sourceNodeId, portId: event.sourcePortId },
      target: { nodeId: newNode.id, portId: 'in' },
    };

    const updated: FlowDefinition = {
      ...this.value,
      nodes: [...this.value.nodes, newNode],
      edges: [...this.value.edges, newEdge],
    };

    this.emitDefinition(updated, { command: 'deleteSelection' as any, payload: newNode.id });
    this.selectSingle({ id: newNode.id, kind: 'node' });
    this.scheduleCanvasFit();
  }

  executeCommand(cmd: FlowCommand): void {
    if (!this.isCommandEnabled(cmd)) {
      return;
    }

    this.closeContextMenu();
    let commandEmitted = false;

    switch (cmd) {
      case 'undo':
        this.applyHistoryValue(this.history.undo(), cmd);
        commandEmitted = true;
        break;
      case 'redo':
        this.applyHistoryValue(this.history.redo(), cmd);
        commandEmitted = true;
        break;
      case 'fit':
        this.canvas?.engineInstance?.fitContent();
        break;
      case 'zoomIn':
        this.canvas?.engineInstance?.zoomIn();
        break;
      case 'zoomOut':
        this.canvas?.engineInstance?.zoomOut();
        break;
      case 'resetZoom':
        this.canvas?.engineInstance?.resetZoom();
        break;
      case 'autoLayout':
        this.canvas?.engineInstance?.autoLayout();
        this.canvas?.engineInstance?.fitContent();
        break;
      case 'toggleNavigator':
        this.navigatorOpen.update(v => !v);
        break;
      case 'toggleInspector':
        this.inspectorOpen.update(v => !v);
        break;
      case 'fullscreen':
        this.toggleFullscreen();
        break;
      case 'duplicateSelection':
        this.duplicateSelection();
        commandEmitted = true;
        break;
      case 'exportJson':
        this.exportJson();
        break;
      case 'importJson':
        this.importInput?.nativeElement.click();
        break;
      case 'deleteSelection':
        this.deleteSelection();
        commandEmitted = true;
        break;
      default:
        break;
    }

    if (!commandEmitted) {
      this.command.emit({ command: cmd });
    }
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    input.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? '')) as FlowDefinition;
        const normalized = this.normalizeImportedDefinition(parsed);
        this.clearSelection();
        this.emitDefinition(normalized, { command: 'importJson', payload: { fileName: file.name } });
      } catch (error) {
        this.validationChange.emit([{
          message: error instanceof Error ? error.message : 'Invalid flow JSON',
          severity: 'error',
        }]);
      }
    };
    reader.readAsText(file);
  }

  onInspectorFieldChange(field: FlowInspectorField, value: unknown): void {
    if (!this.value || !this.selectedNode || this.resolvedMode !== 'edit' || field.readonly) {
      return;
    }

    const node = this.selectedNode;
    const normalizedValue = this.normalizeInspectorValue(field, value);
    const patch = this.createNodePatch(node, field.key, normalizedValue);
    const updated = FlowDiagramData.from(this.value).updateNode(node.id, patch);
    this.nodeChange.emit({
      type: 'update',
      node: updated.nodes.find(item => item.id === node.id) ?? node,
      previousNode: node,
    });
    this.emitDefinition(updated);
  }

  onInspectorFormValueChange(event: FlowInspectorFormChange): void {
    if (!this.value || !this.selectedNode || this.resolvedMode !== 'edit') {
      return;
    }

    const node = this.selectedNode;
    const patch = createFlowInspectorNodePatch(node, event.value, event.fieldPaths);
    if (!Object.keys(patch).length) {
      return;
    }
    const updated = FlowDiagramData.from(this.value).updateNode(node.id, patch);
    this.nodeChange.emit({
      type: 'update',
      node: updated.nodes.find(item => item.id === node.id) ?? node,
      previousNode: node,
    });
    this.emitDefinition(updated);
  }

  inspectorFieldValue(field: FlowInspectorField): unknown {
    const node = this.selectedNode;
    if (!node) return null;
    if (field.key === 'label') return node.label ?? '';
    if (field.key === 'type') return node.type;
    if (field.key === 'id') return node.id;
    const dataKey = field.key.startsWith('data.') ? field.key.slice(5) : field.key;
    return this.readPath(node.data ?? {}, dataKey);
  }

  inspectorFieldText(field: FlowInspectorField): string {
    const value = this.inspectorFieldValue(field);
    if (value == null) return '';
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  inspectorFieldNumber(field: FlowInspectorField): number | null {
    const value = this.inspectorFieldValue(field);
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  inspectorFieldBoolean(field: FlowInspectorField): boolean {
    return this.inspectorFieldValue(field) === true;
  }

  inspectorFieldOptions(field: FlowInspectorField): Array<{ label: string; value: InspectorSelectValue }> {
    return (field.options ?? []).map(option => ({
      label: option.label,
      value: this.toSelectValue(option.value),
    }));
  }

  contextMenuStyle(menu: ActiveFlowContextMenu): Record<string, string> {
    return {
      left: `${menu.localX}px`,
      top: `${menu.localY}px`,
    };
  }

  contextMenuTitle(menu: ActiveFlowContextMenu): string {
    switch (menu.targetType) {
      case 'node':
        return this.selectedNode?.label ?? this.selectedNode?.type ?? 'Node';
      case 'edge':
        return 'shared.flowBuilder.inspector.edgeTitle';
      default:
        return 'shared.flowBuilder.contextMenu.canvas';
    }
  }

  runContextMenuCommand(command: FlowCommand): void {
    this.executeCommand(command);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.resolvedMode !== 'edit') return;
    if (!this.host.nativeElement.contains(document.activeElement) && document.activeElement !== document.body) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.executeCommand('undo');
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.executeCommand('redo');
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.executeCommand('duplicateSelection');
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.executeCommand('deleteSelection');
    } else if (event.key === 'Escape') {
      if (this.contextMenuState()) {
        this.closeContextMenu();
        return;
      }
      this.onBlankClick();
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (typeof document === 'undefined') return;
    this.fullscreen.set(document.fullscreenElement === this.host.nativeElement);
    this.scheduleCanvasFit();
  }

  closeContextMenu(): void {
    this.contextMenuState.set(null);
  }

  private selectSingle(item: FlowSelectionItem): void {
    this.selectedId = item.id;
    this.selection = { primaryId: item.id, items: [item] };
    this.selectedIdChange.emit(item.id);
    this.selectionChange.emit(this.selection);
  }

  private clearSelection(): void {
    this.selectedId = null;
    this.selection = EMPTY_FLOW_SELECTION;
    this.selectedIdChange.emit(null);
    this.selectionChange.emit(this.selection);
  }

  private emitDefinition(definition: FlowDefinition, command?: FlowCommandEvent): void {
    this.value = definition;
    this.history.commit(definition);
    this.valueChange.emit(definition);
    if (command) {
      this.command.emit(command);
    }
  }

  private applyHistoryValue(definition: FlowDefinition | null, cmd: FlowCommand): void {
    if (!definition) return;
    this.value = definition;
    this.valueChange.emit(definition);
    this.command.emit({ command: cmd });
  }

  private deleteSelection(): void {
    if (!this.value || this.selectedIds.length === 0) return;
    const deletedIds = [...this.selectedIds];
    const updated = FlowDiagramData.from(this.value).removeSelection(deletedIds);
    this.clearSelection();
    this.emitDefinition(updated, { command: 'deleteSelection', payload: deletedIds });
  }

  private duplicateSelection(): void {
    if (!this.value || this.selectedIds.length === 0) return;
    const result = FlowDiagramData.from(this.value).duplicateSelection(this.selectedIds);
    if (result.duplicatedIds.length === 0) return;
    this.emitDefinition(result.definition, { command: 'duplicateSelection', payload: result.duplicatedIds });
    this.selectSingle({ id: result.duplicatedIds[0], kind: 'node' });
  }

  private addNodeFromType(nodeType: string, centerX: number, centerY: number): void {
    if (!this.value || this.resolvedMode !== 'edit') return;
    const typeDef = this.resolvedNodeTypes.find(type => type.type === nodeType);
    if (!typeDef) return;

    const size = typeDef.defaultSize ?? { width: 200, height: 70 };
    const node: FlowNode = {
      id: this.createNodeId(nodeType),
      type: nodeType,
      label: typeDef.label,
      size,
      position: {
        x: Math.round(centerX - size.width / 2),
        y: Math.round(centerY - size.height / 2),
      },
      data: this.resolveDefaultData(typeDef),
    };
    const updated: FlowDefinition = {
      ...this.value,
      nodes: [...this.value.nodes, node],
    };

    this.nodeChange.emit({ type: 'add', node });
    this.emitDefinition(updated);
    this.selectSingle({ id: node.id, kind: 'node' });
  }

  private viewportCenter(): { x: number; y: number } {
    const rect = this.canvas?.canvasContainer?.nativeElement.getBoundingClientRect();
    if (!rect || !this.canvas?.engineInstance) {
      return { x: 0, y: 0 };
    }
    return this.canvas.engineInstance.clientToLocalPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  }

  private createNodeId(nodeType: string): string {
    const existingIds = new Set(this.value?.nodes.map(node => node.id) ?? []);
    let index = existingIds.size + 1;
    let candidate = `${nodeType}-${Date.now().toString(36)}`;
    while (existingIds.has(candidate)) {
      index += 1;
      candidate = `${nodeType}-${index}`;
    }
    return candidate;
  }

  private resolveDefaultData(typeDef: FlowNodeTypeDefinition): Record<string, unknown> {
    if (!typeDef.defaultData) return {};
    const value = typeof typeDef.defaultData === 'function' ? typeDef.defaultData() : typeDef.defaultData;
    return cloneFlowValue(value);
  }

  private openContextMenu(event: FlowContextMenuEvent): void {
    if (!this.resolvedCapabilities.contextActions) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = event.targetType === 'blank' ? 112 : 148;
    const localX = Math.min(Math.max(event.x - rect.left, 8), Math.max(rect.width - menuWidth - 8, 8));
    const localY = Math.min(Math.max(event.y - rect.top, 8), Math.max(rect.height - menuHeight - 8, 8));
    this.contextMenuState.set({ ...event, localX, localY });
  }

  private exportJson(): void {
    if (!this.value || typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(this.value, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.value.name || this.value.id || 'flow'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private toggleFullscreen(): void {
    if (typeof document === 'undefined') return;
    const hostElement = this.host.nativeElement;
    if (!document.fullscreenElement) {
      void hostElement.requestFullscreen?.();
      return;
    }
    if (document.fullscreenElement === hostElement) {
      void document.exitFullscreen?.();
    }
  }

  private scheduleCanvasFit(): void {
    requestAnimationFrame(() => {
      this.canvas?.engineInstance?.resizeToContainer();
      requestAnimationFrame(() => {
        this.canvas?.engineInstance?.fitContent();
      });
    });
  }

  private normalizeImportedDefinition(definition: FlowDefinition): FlowDefinition {
    if (!definition?.nodes || !definition?.edges) {
      throw new Error('Invalid flow JSON');
    }
    return cloneFlowDefinition({
      id: definition.id || `flow-${Date.now().toString(36)}`,
      version: 1,
      name: definition.name,
      readonly: definition.readonly,
      viewport: definition.viewport,
      nodes: definition.nodes,
      edges: definition.edges,
      metadata: definition.metadata,
    });
  }

  private normalizeInspectorValue(field: FlowInspectorField, value: unknown): unknown {
    switch (field.type) {
      case 'number': {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
      }
      case 'boolean':
        return value === true;
      case 'json':
        if (typeof value !== 'string') return value;
        try {
          return value.trim() ? JSON.parse(value) : null;
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private createNodePatch(node: FlowNode, key: string, value: unknown): Partial<FlowNode> {
    if (key === 'label') return { label: String(value ?? '') };
    if (key === 'status') return { status: value as FlowNode['status'] };
    if (key === 'disabled') return { disabled: value === true };
    if (key === 'readonly') return { readonly: value === true };

    const dataKey = key.startsWith('data.') ? key.slice(5) : key;
    return {
      data: this.writePath(node.data ?? {}, dataKey, value),
    };
  }

  private readPath(source: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((current, segment) => {
      if (current && typeof current === 'object' && segment in current) {
        return (current as Record<string, unknown>)[segment];
      }
      return null;
    }, source);
  }

  private writePath(source: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
    const segments = path.split('.').filter(Boolean);
    if (segments.length === 0) return source;
    const result = cloneFlowValue(source);
    let cursor: Record<string, unknown> = result;
    segments.slice(0, -1).forEach(segment => {
      const existing = cursor[segment];
      if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Record<string, unknown>;
    });
    cursor[segments[segments.length - 1]] = value;
    return result;
  }

  private toSelectValue(value: unknown): InspectorSelectValue {
    if (value == null) {
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    return JSON.stringify(value);
  }
}
