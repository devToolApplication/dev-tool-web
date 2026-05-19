import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import {
  ArrayFieldState,
  FieldState,
  GridWidth,
  TreeFormNode,
  TreeSelectStrategy,
  TreeSelectionPreset,
  TreePickerOption,
  TreeFieldState
} from '../../models/form-config.model';
import { getColClass } from '../../utils/form.utils';
import { ConfirmDialogService } from '../../../overlay/confirm-dialog/confirm-dialog.service';

type TreeFilterMode = 'all' | 'selected' | 'leaf';

interface TreeNodeSelectionState {
  checked: boolean;
  indeterminate: boolean;
  selectable: boolean;
}

interface TreeViewNode {
  node: TreeFormNode;
  path: string;
  code?: string;
  children: TreeViewNode[];
  matched: boolean;
  forceExpanded: boolean;
  checked: boolean;
  indeterminate: boolean;
  leaf: boolean;
}

interface SelectedTreeItem {
  node: TreeFormNode;
  path: string;
  code?: string;
  leaf: boolean;
}

interface TreeBadgeView {
  label: string;
  variant: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
}

@Component({
  selector: 'app-field-tree-renderer',
  standalone: false,
  templateUrl: './field-tree-renderer.html',
  styleUrl: './field-tree-renderer.css'
})
export class FieldTreeRendererComponent implements OnDestroy {
  @Input({ required: true })
  field!: TreeFieldState;
  @Input() pickerSearchDebounceMs = 250;
  @Input() submitted = false;
  @Input() readonlyMode = false;
  @Output() pickerRetry = new EventEmitter<void>();
  @Output() treeRetry = new EventEmitter<void>();

  constructor(
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  pickerOpen = false;
  pickerMode: 'add' | 'replace' = 'add';
  pickerParentId: string | null = null;
  pickerTargetId: string | null = null;
  pickerQuery = '';
  readonly treeQuery = signal('');
  readonly treeFilterMode = signal<TreeFilterMode>('all');
  readonly collapsedNodeIds = signal<Set<string>>(new Set());
  readonly selectedPickerOptionIds = signal<Set<string>>(new Set());
  readonly detailNode = signal<TreeFormNode | null>(null);
  readonly actionNode = signal<TreeFormNode | null>(null);
  readonly focusedNodeId = signal<string | null>(null);
  readonly advancedJsonDraft = signal<string | null>(null);
  readonly advancedJsonError = signal<string | null>(null);
  private pickerSearchTimer?: ReturnType<typeof setTimeout>;
  private visibleTreeCache?: {
    nodes: TreeFormNode[];
    query: string;
    mode: TreeFilterMode;
    value: TreeViewNode[];
  };
  private selectedItemsCache?: {
    nodes: TreeFormNode[];
    strategy: TreeSelectStrategy;
    value: SelectedTreeItem[];
  };

  ngOnDestroy(): void {
    if (this.pickerSearchTimer) {
      clearTimeout(this.pickerSearchTimer);
    }
  }

  getCol(width?: GridWidth): string {
    return getColClass(width);
  }

  isArrayField(field: FieldState | ArrayFieldState): field is ArrayFieldState {
    return field.type === 'array';
  }

  isTreeField(field: FieldState | ArrayFieldState): field is TreeFieldState {
    return field.type === 'tree';
  }

  get isTemplateTree(): boolean {
    return (this.field.fieldConfig.children?.length ?? 0) > 0;
  }

  get nodes(): TreeFormNode[] {
    const value = this.field.value();
    return Array.isArray(value) ? value : [];
  }

  get labels() {
    return this.field.fieldConfig.treeConfig?.labels ?? {};
  }

  get treeConfig() {
    return this.field.fieldConfig.treeConfig;
  }

  get searchable(): boolean {
    return this.treeConfig?.searchable !== false;
  }

  get showToolbar(): boolean {
    return this.treeConfig?.showToolbar !== false;
  }

  get hasCheckboxSelection(): boolean {
    return this.treeConfig?.selectionMode === 'checkbox';
  }

  get showFilterTabs(): boolean {
    return this.hasCheckboxSelection && this.treeConfig?.showFilterTabs === true;
  }

  get showSelectedPanel(): boolean {
    return this.hasCheckboxSelection && this.treeConfig?.showSelectedPanel === true;
  }

  get showNodeActions(): boolean {
    return this.canEdit() && this.treeConfig?.showNodeActions !== false;
  }

  get showPath(): boolean {
    return this.treeConfig?.showPath === true || this.treeQuery().trim().length > 0;
  }

  get showBadges(): boolean {
    return this.treeConfig?.showBadges !== false && this.treeConfig?.nodeDisplay?.showBadges !== false;
  }

  get showCounts(): boolean {
    return this.treeConfig?.showCounts !== false;
  }

  get selectStrategy(): TreeSelectStrategy {
    return this.treeConfig?.selectStrategy ?? 'parentAndChildren';
  }

  get treeLoading(): boolean {
    return this.treeConfig?.loading === true;
  }

  get treeError(): string | null {
    return this.treeConfig?.error ?? null;
  }

  get visibleTree(): TreeViewNode[] {
    const nodes = this.nodes;
    const query = this.treeQuery().trim().toLowerCase();
    const mode = this.treeFilterMode();
    if (
      this.visibleTreeCache
      && this.visibleTreeCache.nodes === nodes
      && this.visibleTreeCache.query === query
      && this.visibleTreeCache.mode === mode
    ) {
      return this.visibleTreeCache.value;
    }

    const value = this.buildVisibleNodes(nodes, '', query, mode);
    this.visibleTreeCache = { nodes, query, mode, value };
    return value;
  }

  get selectedItems(): SelectedTreeItem[] {
    const nodes = this.nodes;
    const strategy = this.selectStrategy;
    if (
      this.selectedItemsCache
      && this.selectedItemsCache.nodes === nodes
      && this.selectedItemsCache.strategy === strategy
    ) {
      return this.selectedItemsCache.value;
    }

    const value = this.collectSelectedItems(nodes);
    this.selectedItemsCache = { nodes, strategy, value };
    return value;
  }

  get selectedCount(): number {
    return this.selectedItems.length;
  }

  get selectionPresetItems() {
    return this.treeConfig?.selectionPresets ?? [];
  }

  get pickerOptions(): TreePickerOption[] {
    const query = this.pickerQuery.trim().toLowerCase();
    const options = this.field.fieldConfig.pickerOptions ?? [];
    if (!query) {
      return options;
    }
    return options.filter((option) =>
      `${option.label} ${option.subtitle ?? ''} ${option.description ?? ''}`.toLowerCase().includes(query)
    );
  }

  get pickerMultiSelect(): boolean {
    return this.field.fieldConfig.treeConfig?.picker?.multiSelect === true;
  }

  get pickerLoading(): boolean {
    return this.field.fieldConfig.treeConfig?.picker?.loading === true;
  }

  get pickerError(): string | null {
    return this.field.fieldConfig.treeConfig?.picker?.error ?? null;
  }

  canEdit(): boolean {
    return !this.readonlyMode && !this.field.disabled() && this.field.fieldConfig.treeConfig?.readonly !== true;
  }

  async clear(): Promise<void> {
    if (!this.canEdit() || this.nodes.length === 0) {
      return;
    }

    const confirmed = await this.confirmDialogService.confirm({
      message: 'shared.tree.confirmClear',
      confirmText: this.labels.clear ?? 'clear',
      variant: 'danger'
    });
    if (!confirmed) {
      return;
    }
    this.field.setValue([]);
    this.field.markAsTouched();
  }

  addGroup(parentId: string | null = null): void {
    if (!this.canEdit() || this.field.fieldConfig.treeConfig?.allowGroupNode !== true) {
      return;
    }
    const label = this.labels.addGroup ?? 'shared.tree.group';
    const node: TreeFormNode = {
      id: crypto.randomUUID(),
      label,
      value: { type: 'group' },
      type: 'group',
      children: []
    };
    this.field.setValue(this.addNode(this.nodes, node, parentId));
    this.field.markAsTouched();
  }

  expandAll(): void {
    this.collapsedNodeIds.set(new Set());
  }

  collapseAll(): void {
    this.collapsedNodeIds.set(new Set(this.flattenNodes(this.nodes).map((node) => node.id)));
  }

  validateTree(): void {
    this.field.markAsTouched();
  }

  setTreeQuery(value: string | null): void {
    this.treeQuery.set(value ?? '');
  }

  clearTreeSearch(): void {
    this.treeQuery.set('');
  }

  setTreeFilterMode(mode: TreeFilterMode): void {
    this.treeFilterMode.set(mode);
  }

  retryTree(): void {
    this.treeRetry.emit();
    this.pickerRetry.emit();
  }

  expandSelected(): void {
    const ancestors = new Set<string>();
    this.collectSelectedAncestors(this.nodes, [], ancestors);
    const next = new Set(this.collapsedNodeIds());
    ancestors.forEach((id) => next.delete(id));
    this.collapsedNodeIds.set(next);
  }

  toggleNodeSelection(node: TreeFormNode, selected: boolean | null): void {
    if (!this.canSelectNode(node)) {
      return;
    }
    this.field.setValue(this.updateNodeSelection(this.nodes, node.id, selected === true));
    this.field.markAsTouched();
  }

  clearSelection(): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(this.clearSelectionInNodes(this.nodes));
    this.field.markAsTouched();
  }

  removeSelectedItem(nodeId: string): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(this.updateNodeSelection(this.nodes, nodeId, false));
    this.field.markAsTouched();
  }

  selectVisibleNodes(): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    const visibleIds = new Set(this.flattenViewNodes(this.visibleTree).map((view) => view.node.id));
    this.field.setValue(this.updateSelectionForIds(this.nodes, visibleIds, true));
    this.field.markAsTouched();
  }

  selectDescendants(nodeId: string): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(this.updateDescendantsSelection(this.nodes, nodeId, true));
    this.field.markAsTouched();
  }

  unselectDescendants(nodeId: string): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(this.updateDescendantsSelection(this.nodes, nodeId, false));
    this.field.markAsTouched();
  }

  applySelectionPreset(presetId: string): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    const preset = this.selectionPresetItems.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    const base = preset.clearBeforeApply === false ? this.nodes : this.clearSelectionInNodes(this.nodes);
    this.field.setValue(this.applyPresetToNodes(base, preset));
    this.field.markAsTouched();
  }

  nodeSelectionState(node: TreeFormNode): TreeNodeSelectionState {
    const selectable = this.isNodeSelectable(node);
    const children = node.children ?? [];
    const childStates = children.map((child) => this.nodeSelectionState(child));
    const hasChildSelection = childStates.some((state) => state.checked || state.indeterminate);
    const allChildrenChecked = childStates.length > 0 && childStates.every((state) => state.checked && !state.indeterminate);

    if (this.selectStrategy === 'leafOnly') {
      if (!children.length) {
        return {
          checked: node.checked === true,
          indeterminate: false,
          selectable
        };
      }
      return {
        checked: allChildrenChecked,
        indeterminate: hasChildSelection && !allChildrenChecked,
        selectable
      };
    }

    if (this.selectStrategy === 'all') {
      const checked = selectable && node.checked === true;
      return {
        checked,
        indeterminate: !checked && hasChildSelection,
        selectable
      };
    }

    if (!children.length) {
      return {
        checked: selectable && node.checked === true,
        indeterminate: false,
        selectable
      };
    }

    const selfChecked = selectable && node.checked === true;
    const checked = allChildrenChecked && (selfChecked || hasChildSelection);
    return {
      checked,
      indeterminate: (selfChecked || hasChildSelection) && !checked,
      selectable
    };
  }

  isViewExpanded(view: TreeViewNode): boolean {
    return view.forceExpanded || this.isExpanded(view.node.id);
  }

  openNodeActions(node: TreeFormNode): void {
    if (this.showNodeActions) {
      this.actionNode.set(node);
    }
  }

  focusSelectedNode(nodeId: string): void {
    this.treeQuery.set('');
    this.treeFilterMode.set('all');
    this.expandPathToNode(nodeId);
    this.focusedNodeId.set(nodeId);
    setTimeout(() => this.scrollNodeIntoView(nodeId));
  }

  onNodeKeydown(event: KeyboardEvent, view: TreeViewNode): void {
    if (event.ctrlKey && event.key.toLowerCase() === 'a') {
      if (this.hasCheckboxSelection) {
        event.preventDefault();
        this.selectVisibleNodes();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
        if (view.children.length && !this.isViewExpanded(view)) {
          event.preventDefault();
          this.expandNode(view.node.id);
        }
        break;
      case 'ArrowLeft':
        if (view.children.length && this.isViewExpanded(view)) {
          event.preventDefault();
          this.collapseNode(view.node.id);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNodeByOffset(view.node.id, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusNodeByOffset(view.node.id, -1);
        break;
      case ' ':
        if (this.hasCheckboxSelection) {
          event.preventDefault();
          this.toggleNodeSelection(view.node, !view.checked);
        }
        break;
      case 'Enter':
        event.preventDefault();
        this.viewNode(view.node);
        break;
      case 'Escape':
        if (this.treeQuery()) {
          event.preventDefault();
          this.clearTreeSearch();
        }
        break;
    }
  }

  toggleNode(nodeId: string): void {
    const next = new Set(this.collapsedNodeIds());
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    this.collapsedNodeIds.set(next);
  }

  isExpanded(nodeId: string): boolean {
    return !this.collapsedNodeIds().has(nodeId);
  }

  expandNode(nodeId: string): void {
    const next = new Set(this.collapsedNodeIds());
    next.delete(nodeId);
    this.collapsedNodeIds.set(next);
  }

  collapseNode(nodeId: string): void {
    const next = new Set(this.collapsedNodeIds());
    next.add(nodeId);
    this.collapsedNodeIds.set(next);
  }

  openAddPicker(parentId: string | null = null): void {
    if (!this.canUsePicker('add')) {
      return;
    }
    this.pickerMode = 'add';
    this.pickerParentId = parentId;
    this.pickerTargetId = null;
    this.pickerQuery = '';
    this.selectedPickerOptionIds.set(new Set());
    this.pickerOpen = true;
  }

  openReplacePicker(nodeId: string): void {
    if (!this.canUsePicker('replace')) {
      return;
    }
    this.pickerMode = 'replace';
    this.pickerParentId = null;
    this.pickerTargetId = nodeId;
    this.pickerQuery = '';
    this.selectedPickerOptionIds.set(new Set());
    this.pickerOpen = true;
  }

  selectOption(option: TreePickerOption): void {
    if (!this.canUsePicker(this.pickerMode) || option.disabled) {
      return;
    }

    const node = this.optionToNode(option);
    const nextNodes = this.pickerMode === 'replace' && this.pickerTargetId
      ? this.replaceNode(this.nodes, this.pickerTargetId, node)
      : this.addNode(this.nodes, node, this.pickerParentId);

    this.field.setValue(nextNodes);
    this.field.markAsTouched();
    this.pickerOpen = false;
  }

  togglePickerOption(option: TreePickerOption, selected: boolean | null): void {
    if (!this.canUsePicker('add') || option.disabled) {
      return;
    }
    const next = new Set(this.selectedPickerOptionIds());
    if (selected) {
      next.add(option.id);
    } else {
      next.delete(option.id);
    }
    this.selectedPickerOptionIds.set(next);
  }

  setPickerQueryDebounced(value: string | null): void {
    if (this.pickerSearchTimer) {
      clearTimeout(this.pickerSearchTimer);
    }
    const delay = Math.max(0, this.pickerSearchDebounceMs);
    this.pickerSearchTimer = setTimeout(() => {
      this.pickerQuery = value ?? '';
    }, delay);
  }

  addSelectedOptions(): void {
    if (!this.canUsePicker('add')) {
      return;
    }

    const ids = this.selectedPickerOptionIds();
    const selected = (this.field.fieldConfig.pickerOptions ?? []).filter((option) => ids.has(option.id) && !option.disabled);
    if (!selected.length) {
      return;
    }

    const next = selected.reduce(
      (nodes, option) => this.addNode(nodes, this.optionToNode(option), this.pickerParentId),
      this.nodes
    );
    this.field.setValue(next);
    this.field.markAsTouched();
    this.pickerOpen = false;
    this.selectedPickerOptionIds.set(new Set());
  }

  moveNode(nodeId: string, direction: -1 | 1): void {
    if (!this.canEdit() || this.field.fieldConfig.treeConfig?.allowMoveNode === false) {
      return;
    }
    this.field.setValue(this.moveInNodes(this.nodes, nodeId, direction));
    this.field.markAsTouched();
  }

  nodeHasError(nodeId: string): boolean {
    const errors = this.field.errors();
    if (!errors) {
      return false;
    }
    return Object.keys(errors).some((key) => key.startsWith(this.nodeErrorPrefix(nodeId)));
  }

  nodeErrors(nodeId: string): string[] {
    const errors = this.field.errors();
    if (!errors) {
      return [];
    }
    return Object.entries(errors)
      .filter(([key]) => key.startsWith(this.nodeErrorPrefix(nodeId)))
      .map(([, message]) => message);
  }

  nodeBadges(node: TreeFormNode): TreeBadgeView[] {
    if (!this.showBadges) {
      return [];
    }
    const badges: TreeBadgeView[] = [...(node.badges ?? [])];
    if (node.status) {
      badges.push({
        label: node.status,
        variant: node.status === 'active' ? 'success' : node.status === 'inactive' ? 'muted' : 'warning'
      });
    }
    if (node.severity && node.severity !== 'normal') {
      badges.push({
        label: node.severity,
        variant: node.severity === 'critical' || node.severity === 'danger' ? 'danger' : 'warning'
      });
    }
    if (node.type && !badges.some((badge) => badge.label === node.type)) {
      badges.push({ label: node.type, variant: 'info' });
    }
    return badges;
  }

  nodeCode(node: TreeFormNode): string | undefined {
    const valueRecord = node.value && typeof node.value === 'object' && !Array.isArray(node.value)
      ? node.value as Record<string, unknown>
      : {};
    return this.nonEmptyString(
      node.code
        ?? node.key
        ?? node.data?.['code']
        ?? valueRecord['code']
        ?? valueRecord['id']
    );
  }

  hasNodeChildren(node: TreeFormNode): boolean {
    return (node.children?.length ?? 0) > 0 || node.hasChildren === true || node.loading === true;
  }

  canMove(nodeId: string, direction: -1 | 1): boolean {
    return this.canEdit() && this.field.fieldConfig.treeConfig?.allowMoveNode !== false && this.canMoveInNodes(this.nodes, nodeId, direction);
  }

  duplicateNode(nodeId: string): void {
    if (!this.canEdit()) {
      return;
    }
    this.field.setValue(this.duplicateInNodes(this.nodes, nodeId));
    this.field.markAsTouched();
  }

  viewNode(node: TreeFormNode): void {
    this.detailNode.set(node);
  }

  async removeNode(nodeId: string): Promise<void> {
    if (!this.canEdit() || this.field.fieldConfig.treeConfig?.allowRemoveNode === false) {
      return;
    }

    const confirmed = await this.confirmDialogService.confirm({
      message: 'shared.tree.confirmRemove',
      confirmText: this.labels.remove ?? 'delete',
      variant: 'danger'
    });
    if (!confirmed) {
      return;
    }
    this.field.setValue(this.removeFromNodes(this.nodes, nodeId));
    this.field.markAsTouched();
  }

  advancedJsonText(): string {
    return this.advancedJsonDraft() ?? JSON.stringify(this.nodes, null, 2);
  }

  onAdvancedJsonChange(value: string | null): void {
    this.advancedJsonDraft.set(value ?? '');
    this.advancedJsonError.set(null);
  }

  applyAdvancedJson(): void {
    if (!this.canEdit() || this.field.fieldConfig.treeConfig?.advancedJson?.editable !== true) {
      return;
    }

    const text = this.advancedJsonText();
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        this.advancedJsonError.set('shared.tree.invalidJsonArray');
        return;
      }
      const normalized = this.normalizeJsonNodes(parsed);
      if (!normalized) {
        this.advancedJsonError.set('shared.tree.invalidJsonArray');
        return;
      }
      this.field.setValue(normalized);
      this.field.markAsTouched();
      this.advancedJsonDraft.set(null);
      this.advancedJsonError.set(null);
    } catch {
      this.advancedJsonError.set('shared.json.invalid');
    }
  }

  resetAdvancedJson(): void {
    this.advancedJsonDraft.set(null);
    this.advancedJsonError.set(null);
  }

  private buildVisibleNodes(
    nodes: TreeFormNode[],
    parentPath: string,
    query: string,
    mode: TreeFilterMode
  ): TreeViewNode[] {
    return nodes.flatMap((node) => {
      const path = this.nodePath(node, parentPath);
      const code = this.nodeCode(node);
      const children = this.buildVisibleNodes(node.children ?? [], path, query, mode);
      const state = this.nodeSelectionState(node);
      const leaf = (node.children?.length ?? 0) === 0;
      const ownFilterMatch = this.matchesFilterMode(node, state, leaf, mode);
      const ownQueryMatch = !query || this.nodeSearchText(node, path, code).includes(query);
      const includeNode = (ownFilterMatch && ownQueryMatch) || children.length > 0;

      if (!includeNode) {
        return [];
      }

      return [{
        node,
        path,
        code,
        children,
        matched: !!query && ownFilterMatch && ownQueryMatch,
        forceExpanded: children.length > 0 && (!!query || mode !== 'all'),
        checked: state.checked,
        indeterminate: state.indeterminate,
        leaf
      }];
    });
  }

  private matchesFilterMode(
    node: TreeFormNode,
    state: TreeNodeSelectionState,
    leaf: boolean,
    mode: TreeFilterMode
  ): boolean {
    switch (mode) {
      case 'selected':
        return state.checked || state.indeterminate || node.checked === true;
      case 'leaf':
        return leaf;
      case 'all':
      default:
        return true;
    }
  }

  private nodePath(node: TreeFormNode, parentPath: string): string {
    const explicitPath = this.nonEmptyString(node.path);
    if (explicitPath) {
      return explicitPath;
    }
    return parentPath ? `${parentPath} / ${node.label}` : node.label;
  }

  private nodeSearchText(node: TreeFormNode, path: string, code?: string): string {
    return [
      node.label,
      code,
      path,
      node.type,
      node.status,
      node.severity,
      node.subtitle,
      node.description
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private collectSelectedItems(nodes: TreeFormNode[], parentPath = ''): SelectedTreeItem[] {
    return nodes.flatMap((node) => {
      const path = this.nodePath(node, parentPath);
      const leaf = (node.children?.length ?? 0) === 0;
      const current = this.isSelectedForPanel(node, leaf)
        ? [{ node, path, code: this.nodeCode(node), leaf }]
        : [];
      return [
        ...current,
        ...this.collectSelectedItems(node.children ?? [], path)
      ];
    });
  }

  private isSelectedForPanel(node: TreeFormNode, leaf: boolean): boolean {
    if (node.checked !== true) {
      return false;
    }
    return this.selectStrategy !== 'leafOnly' || leaf;
  }

  private collectSelectedAncestors(nodes: TreeFormNode[], ancestors: string[], result: Set<string>): void {
    nodes.forEach((node) => {
      const state = this.nodeSelectionState(node);
      if (state.checked || state.indeterminate || node.checked === true) {
        ancestors.forEach((id) => result.add(id));
      }
      this.collectSelectedAncestors(node.children ?? [], [...ancestors, node.id], result);
    });
  }

  canSelectNode(node: TreeFormNode): boolean {
    return this.hasCheckboxSelection && this.canEdit() && this.isNodeSelectable(node);
  }

  private isNodeSelectable(node: TreeFormNode): boolean {
    if (node.disabled || node.readonly || node.selectable === false) {
      return false;
    }
    return true;
  }

  private updateNodeSelection(nodes: TreeFormNode[], nodeId: string, checked: boolean): TreeFormNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return this.applyNodeSelection(node, checked, true);
      }

      return {
        ...node,
        children: node.children ? this.updateNodeSelection(node.children, nodeId, checked) : node.children
      };
    });
  }

  private applyNodeSelection(node: TreeFormNode, checked: boolean, cascade: boolean): TreeFormNode {
    const children = node.children ?? [];

    if (this.selectStrategy === 'leafOnly') {
      if (children.length && cascade) {
        return {
          ...node,
          checked: false,
          indeterminate: false,
          children: this.setSubtreeSelection(children, checked)
        };
      }
      return this.setNodeCheckedOnly(node, checked);
    }

    if (this.selectStrategy === 'parentAndChildren' && cascade) {
      return {
        ...this.setNodeCheckedOnly(node, checked),
        children: children.length ? this.setSubtreeSelection(children, checked) : node.children
      };
    }

    return this.setNodeCheckedOnly(node, checked);
  }

  private setSubtreeSelection(nodes: TreeFormNode[], checked: boolean): TreeFormNode[] {
    return nodes.map((node) => {
      const children = node.children ?? [];
      if (this.selectStrategy === 'leafOnly' && children.length) {
        return {
          ...node,
          checked: false,
          indeterminate: false,
          children: this.setSubtreeSelection(children, checked)
        };
      }

      return {
        ...this.setNodeCheckedOnly(node, checked),
        children: children.length ? this.setSubtreeSelection(children, checked) : node.children
      };
    });
  }

  private setNodeCheckedOnly(node: TreeFormNode, checked: boolean): TreeFormNode {
    if (!this.isNodeSelectable(node)) {
      return node;
    }
    if (this.selectStrategy === 'leafOnly' && (node.children?.length ?? 0) > 0) {
      return {
        ...node,
        checked: false,
        indeterminate: false
      };
    }
    return {
      ...node,
      checked,
      indeterminate: false
    };
  }

  private clearSelectionInNodes(nodes: TreeFormNode[]): TreeFormNode[] {
    return nodes.map((node) => ({
      ...node,
      checked: false,
      indeterminate: false,
      children: node.children ? this.clearSelectionInNodes(node.children) : node.children
    }));
  }

  private updateSelectionForIds(nodes: TreeFormNode[], ids: Set<string>, checked: boolean): TreeFormNode[] {
    return nodes.map((node) => {
      const next = ids.has(node.id) ? this.setNodeCheckedOnly(node, checked) : node;
      return {
        ...next,
        children: next.children ? this.updateSelectionForIds(next.children, ids, checked) : next.children
      };
    });
  }

  private updateDescendantsSelection(nodes: TreeFormNode[], nodeId: string, checked: boolean): TreeFormNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          children: node.children ? this.setSubtreeSelection(node.children, checked) : node.children
        };
      }

      return {
        ...node,
        children: node.children ? this.updateDescendantsSelection(node.children, nodeId, checked) : node.children
      };
    });
  }

  private applyPresetToNodes(nodes: TreeFormNode[], preset: TreeSelectionPreset): TreeFormNode[] {
    return nodes.map((node) => {
      const children = node.children ? this.applyPresetToNodes(node.children, preset) : node.children;
      const next = { ...node, children };
      return this.matchesSelectionPreset(next, preset)
        ? this.applyNodeSelection(next, true, this.selectStrategy !== 'all')
        : next;
    });
  }

  private matchesSelectionPreset(node: TreeFormNode, preset: TreeSelectionPreset): boolean {
    if (preset.nodeIds?.includes(node.id)) {
      return true;
    }
    const match = preset.match;
    if (!match) {
      return false;
    }
    if (match.leafOnly && (node.children?.length ?? 0) > 0) {
      return false;
    }
    const label = node.label.toLowerCase();
    const code = (this.nodeCode(node) ?? '').toLowerCase();
    return this.includesAny(label, match.labelIncludes)
      || this.includesAny(code, match.codeIncludes)
      || !!(node.type && match.typeIn?.includes(node.type))
      || !!(node.status && match.statusIn?.includes(node.status))
      || !!(node.severity && match.severityIn?.includes(node.severity));
  }

  private includesAny(value: string, needles?: string[]): boolean {
    return !!needles?.some((needle) => value.includes(needle.toLowerCase()));
  }

  private flattenViewNodes(nodes: TreeViewNode[]): TreeViewNode[] {
    return nodes.flatMap((node) => [node, ...this.flattenViewNodes(node.children)]);
  }

  private expandPathToNode(nodeId: string): void {
    const path = this.findNodePath(this.nodes, nodeId);
    if (!path) {
      return;
    }
    const next = new Set(this.collapsedNodeIds());
    path.slice(0, -1).forEach((id) => next.delete(id));
    this.collapsedNodeIds.set(next);
  }

  private findNodePath(nodes: TreeFormNode[], nodeId: string, path: string[] = []): string[] | null {
    for (const node of nodes) {
      const nextPath = [...path, node.id];
      if (node.id === nodeId) {
        return nextPath;
      }
      const childPath = this.findNodePath(node.children ?? [], nodeId, nextPath);
      if (childPath) {
        return childPath;
      }
    }
    return null;
  }

  private scrollNodeIntoView(nodeId: string): void {
    const row = this.nodeRowElements().find((element) => element.dataset['treeNodeId'] === nodeId);
    if (!row) {
      return;
    }
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    row.focus({ preventScroll: true });
    setTimeout(() => {
      if (this.focusedNodeId() === nodeId) {
        this.focusedNodeId.set(null);
      }
    }, 2400);
  }

  private focusNodeByOffset(nodeId: string, offset: -1 | 1): void {
    const rows = this.nodeRowElements();
    const index = rows.findIndex((element) => element.dataset['treeNodeId'] === nodeId);
    const next = rows[index + offset];
    if (next) {
      next.focus();
    }
  }

  private nodeRowElements(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[data-tree-node-id]'));
  }

  private removeFromNodes(nodes: TreeFormNode[], nodeId: string): TreeFormNode[] {
    return nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => ({
        ...node,
        children: node.children ? this.removeFromNodes(node.children, nodeId) : undefined
      }));
  }

  private canUsePicker(mode: 'add' | 'replace'): boolean {
    if (!this.canEdit()) {
      return false;
    }
    const config = this.field.fieldConfig.treeConfig;
    const pickerEnabled = config?.picker?.enabled !== false;
    if (!pickerEnabled || !this.field.fieldConfig.pickerOptions?.length) {
      return false;
    }
    return mode === 'add' ? config?.allowAddNode !== false : config?.allowReplaceNode === true;
  }

  private optionToNode(option: TreePickerOption): TreeFormNode {
    return {
      id: crypto.randomUUID(),
      label: option.label,
      value: option.value,
      subtitle: option.subtitle,
      description: option.description,
      icon: option.icon,
      badges: option.badges,
      data: {
        ...(option.data ?? {}),
        sourceOptionId: option.id
      },
      disabled: option.disabled,
      disabledReason: option.disabledReason,
      children: option.children?.map((child) => this.optionToNode(child)) ?? []
    };
  }

  private addNode(nodes: TreeFormNode[], node: TreeFormNode, parentId: string | null): TreeFormNode[] {
    if (!parentId) {
      return [...nodes, node];
    }

    return nodes.map((current) => {
      if (current.id === parentId) {
        return {
          ...current,
          children: [...(current.children ?? []), node]
        };
      }

      return {
        ...current,
        children: current.children ? this.addNode(current.children, node, parentId) : current.children
      };
    });
  }

  private replaceNode(nodes: TreeFormNode[], nodeId: string, replacement: TreeFormNode): TreeFormNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        const shouldDropChildren = this.shouldDropReplacementChildren(replacement);
        return {
          ...replacement,
          children: shouldDropChildren ? replacement.children : node.children ?? replacement.children
        };
      }

      return {
        ...node,
        children: node.children ? this.replaceNode(node.children, nodeId, replacement) : node.children
      };
    });
  }

  private moveInNodes(nodes: TreeFormNode[], nodeId: string, direction: -1 | 1): TreeFormNode[] {
    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index >= 0) {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= nodes.length) {
        return nodes;
      }
      const next = [...nodes];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    }

    return nodes.map((node) => ({
      ...node,
      children: node.children ? this.moveInNodes(node.children, nodeId, direction) : node.children
    }));
  }

  private canMoveInNodes(nodes: TreeFormNode[], nodeId: string, direction: -1 | 1): boolean {
    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index >= 0) {
      const targetIndex = index + direction;
      return targetIndex >= 0 && targetIndex < nodes.length;
    }
    return nodes.some((node) => node.children ? this.canMoveInNodes(node.children, nodeId, direction) : false);
  }

  private duplicateInNodes(nodes: TreeFormNode[], nodeId: string): TreeFormNode[] {
    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index >= 0) {
      const duplicate = this.cloneNode(nodes[index]);
      const next = [...nodes];
      next.splice(index + 1, 0, duplicate);
      return next;
    }
    return nodes.map((node) => ({
      ...node,
      children: node.children ? this.duplicateInNodes(node.children, nodeId) : node.children
    }));
  }

  private cloneNode(node: TreeFormNode): TreeFormNode {
    return {
      ...node,
      id: crypto.randomUUID(),
      children: node.children?.map((child) => this.cloneNode(child))
    };
  }

  private flattenNodes(nodes: TreeFormNode[]): TreeFormNode[] {
    return nodes.flatMap((node) => [node, ...this.flattenNodes(node.children ?? [])]);
  }

  private shouldDropReplacementChildren(replacement: TreeFormNode): boolean {
    const behavior = this.field.fieldConfig.treeConfig?.replaceBehavior ?? 'keep-children';
    const replacementAllowsChildren = replacement.data?.['allowChildren'] !== false;
    if (!replacementAllowsChildren) {
      return true;
    }
    return behavior === 'drop-children';
  }

  private normalizeJsonNodes(value: unknown[]): TreeFormNode[] | null {
    const result: TreeFormNode[] = [];
    for (const item of value) {
      const normalized = this.normalizeJsonNode(item);
      if (!normalized) {
        return null;
      }
      result.push(normalized);
    }
    return result;
  }

  private normalizeJsonNode(value: unknown): TreeFormNode | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const raw = value as Record<string, unknown>;
    const label = this.nodeLabel(raw);
    if (!label) {
      return null;
    }

    const rawChildren = raw['children'];
    const children = Array.isArray(rawChildren) ? this.normalizeJsonNodes(rawChildren) : [];
    if (!children) {
      return null;
    }

    return {
      id: this.nonEmptyString(raw['id']) ?? crypto.randomUUID(),
      key: this.nonEmptyString(raw['key']),
      label,
      value: 'value' in raw ? raw['value'] : {},
      code: this.nonEmptyString(raw['code']),
      path: this.nonEmptyString(raw['path']),
      type: this.nonEmptyString(raw['type']),
      status: this.nonEmptyString(raw['status']) as TreeFormNode['status'],
      severity: this.nonEmptyString(raw['severity']) as TreeFormNode['severity'],
      subtitle: this.nonEmptyString(raw['subtitle']),
      description: this.nonEmptyString(raw['description']),
      icon: this.nonEmptyString(raw['icon']),
      badges: Array.isArray(raw['badges']) ? raw['badges'] as TreeFormNode['badges'] : undefined,
      data: raw['data'] && typeof raw['data'] === 'object' && !Array.isArray(raw['data'])
        ? raw['data'] as Record<string, unknown>
        : undefined,
      meta: raw['meta'] && typeof raw['meta'] === 'object' && !Array.isArray(raw['meta'])
        ? raw['meta'] as Record<string, unknown>
        : undefined,
      children,
      selectable: raw['selectable'] === false ? false : undefined,
      checked: raw['checked'] === true,
      indeterminate: raw['indeterminate'] === true,
      expanded: raw['expanded'] === true,
      loading: raw['loading'] === true,
      hasChildren: raw['hasChildren'] === true,
      disabled: raw['disabled'] === true,
      disabledReason: this.nonEmptyString(raw['disabledReason']),
      readonly: raw['readonly'] === true
    };
  }

  private nodeLabel(value: Record<string, unknown>): string | null {
    const explicit = this.nonEmptyString(value['label']);
    if (explicit) {
      return explicit;
    }

    const nodeValue = value['value'];
    if (nodeValue && typeof nodeValue === 'object' && !Array.isArray(nodeValue)) {
      const record = nodeValue as Record<string, unknown>;
      return this.nonEmptyString(record['code'] ?? record['id']) ?? null;
    }

    return this.nonEmptyString(nodeValue) ?? null;
  }

  private nonEmptyString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized || undefined;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return undefined;
  }

  private nodeErrorPrefix(nodeId: string): string {
    return `node:${nodeId}:`;
  }
}
