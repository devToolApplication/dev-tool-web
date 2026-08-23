import type { OnDestroy } from '@angular/core';
import { Component, ElementRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import type {
  ArrayFieldState,
  FieldState,
  GridWidth,
  TreeFormNode,
  TreePickerOption,
  TreeSelectStrategy,
  TreeFieldState,
} from '../../models/form-config.model';
import { getColClass } from '../../utils/form.utils';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import type {
  SelectedTreeItem,
  TreeBadgeView,
  TreeFilterMode,
  TreeNodeSelectionState,
  TreeViewNode,
} from './field-tree-renderer.types';
import {
  addTreeNode,
  applyTreeSelectionPreset,
  buildVisibleTreeNodes,
  canMoveTreeNode,
  clearTreeSelection,
  collectSelectedTreeAncestorIds,
  collectSelectedTreeItems,
  duplicateTreeNode,
  findTreeNodePath,
  flattenTreeNodes,
  flattenTreeViewNodes,
  isTreeNodeSelectable,
  moveTreeNode,
  normalizeJsonTreeNodes,
  removeTreeNode,
  replaceTreeNode,
  treeNodeCode,
  treeNodeErrorPrefix,
  treeNodeSelectionState,
  treePickerOptionToNode,
  updateTreeDescendantsSelection,
  updateTreeNodeSelection,
  updateTreeSelectionForIds,
} from './tree-field.state';

@Component({
  selector: 'app-field-tree-renderer',
  standalone: false,
  templateUrl: './field-tree-renderer.html',
  styleUrl: './field-tree-renderer.css',
})
export class FieldTreeRendererComponent implements OnDestroy {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input({ required: true })
  field!: TreeFieldState;
  @Input() pickerSearchDebounceMs = 250;
  @Input() submitted = false;
  @Input() readonlyMode = false;
  @Output() pickerRetry = new EventEmitter<void>();
  @Output() treeRetry = new EventEmitter<void>();

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
    return Array.isArray(value) ? (value as TreeFormNode[]) : [];
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
    return (
      this.treeConfig?.showBadges !== false && this.treeConfig?.nodeDisplay?.showBadges !== false
    );
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
      this.visibleTreeCache &&
      this.visibleTreeCache.nodes === nodes &&
      this.visibleTreeCache.query === query &&
      this.visibleTreeCache.mode === mode
    ) {
      return this.visibleTreeCache.value;
    }

    const value = buildVisibleTreeNodes(nodes, query, mode, this.selectStrategy);
    this.visibleTreeCache = { nodes, query, mode, value };
    return value;
  }

  get selectedItems(): SelectedTreeItem[] {
    const nodes = this.nodes;
    const strategy = this.selectStrategy;
    if (
      this.selectedItemsCache &&
      this.selectedItemsCache.nodes === nodes &&
      this.selectedItemsCache.strategy === strategy
    ) {
      return this.selectedItemsCache.value;
    }

    const value = collectSelectedTreeItems(nodes, strategy);
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
      `${option.label} ${option.subtitle ?? ''} ${option.description ?? ''}`
        .toLowerCase()
        .includes(query),
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
    return (
      !this.readonlyMode &&
      !this.field.disabled() &&
      this.field.fieldConfig.treeConfig?.readonly !== true
    );
  }

  async clear(): Promise<void> {
    if (!this.canEdit() || this.nodes.length === 0) {
      return;
    }

    const confirmed = await this.confirmDialogService.confirm({
      message: 'shared.tree.confirmClear',
      confirmText: this.labels.clear ?? 'clear',
      variant: 'danger',
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
      children: [],
    };
    this.field.setValue(addTreeNode(this.nodes, node, parentId));
    this.field.markAsTouched();
  }

  expandAll(): void {
    this.collapsedNodeIds.set(new Set());
  }

  collapseAll(): void {
    this.collapsedNodeIds.set(new Set(flattenTreeNodes(this.nodes).map((node) => node.id)));
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
    const ancestors = collectSelectedTreeAncestorIds(this.nodes, this.selectStrategy);
    const next = new Set(this.collapsedNodeIds());
    ancestors.forEach((id) => next.delete(id));
    this.collapsedNodeIds.set(next);
  }

  toggleNodeSelection(node: TreeFormNode, selected: boolean | null): void {
    if (!this.canSelectNode(node)) {
      return;
    }
    this.field.setValue(
      updateTreeNodeSelection(this.nodes, node.id, selected === true, this.selectStrategy),
    );
    this.field.markAsTouched();
  }

  clearSelection(): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(clearTreeSelection(this.nodes));
    this.field.markAsTouched();
  }

  removeSelectedItem(nodeId: string): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(updateTreeNodeSelection(this.nodes, nodeId, false, this.selectStrategy));
    this.field.markAsTouched();
  }

  selectVisibleNodes(): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    const visibleIds = new Set(flattenTreeViewNodes(this.visibleTree).map((view) => view.node.id));
    this.field.setValue(
      updateTreeSelectionForIds(this.nodes, visibleIds, true, this.selectStrategy),
    );
    this.field.markAsTouched();
  }

  selectDescendants(nodeId: string): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(
      updateTreeDescendantsSelection(this.nodes, nodeId, true, this.selectStrategy),
    );
    this.field.markAsTouched();
  }

  unselectDescendants(nodeId: string): void {
    if (!this.hasCheckboxSelection || !this.canEdit()) {
      return;
    }
    this.field.setValue(
      updateTreeDescendantsSelection(this.nodes, nodeId, false, this.selectStrategy),
    );
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
    const base = preset.clearBeforeApply === false ? this.nodes : clearTreeSelection(this.nodes);
    this.field.setValue(applyTreeSelectionPreset(base, preset, this.selectStrategy));
    this.field.markAsTouched();
  }

  nodeSelectionState(node: TreeFormNode): TreeNodeSelectionState {
    return treeNodeSelectionState(node, this.selectStrategy);
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

    const node = treePickerOptionToNode(option);
    const nextNodes =
      this.pickerMode === 'replace' && this.pickerTargetId
        ? replaceTreeNode(
            this.nodes,
            this.pickerTargetId,
            node,
            this.field.fieldConfig.treeConfig?.replaceBehavior,
          )
        : addTreeNode(this.nodes, node, this.pickerParentId);

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
    const selected = (this.field.fieldConfig.pickerOptions ?? []).filter(
      (option) => ids.has(option.id) && !option.disabled,
    );
    if (!selected.length) {
      return;
    }

    const next = selected.reduce(
      (nodes, option) => addTreeNode(nodes, treePickerOptionToNode(option), this.pickerParentId),
      this.nodes,
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
    this.field.setValue(moveTreeNode(this.nodes, nodeId, direction));
    this.field.markAsTouched();
  }

  nodeHasError(nodeId: string): boolean {
    const errors = this.field.errors();
    if (!errors) {
      return false;
    }
    return Object.keys(errors).some((key) => key.startsWith(treeNodeErrorPrefix(nodeId)));
  }

  nodeErrors(nodeId: string): string[] {
    const errors = this.field.errors();
    if (!errors) {
      return [];
    }
    return Object.entries(errors)
      .filter(([key]) => key.startsWith(treeNodeErrorPrefix(nodeId)))
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
        variant:
          node.status === 'active' ? 'success' : node.status === 'inactive' ? 'muted' : 'warning',
      });
    }
    if (node.severity && node.severity !== 'normal') {
      badges.push({
        label: node.severity,
        variant: node.severity === 'critical' || node.severity === 'danger' ? 'danger' : 'warning',
      });
    }
    if (node.type && !badges.some((badge) => badge.label === node.type)) {
      badges.push({ label: node.type, variant: 'info' });
    }
    return badges;
  }

  nodeCode(node: TreeFormNode): string | undefined {
    return treeNodeCode(node);
  }

  hasNodeChildren(node: TreeFormNode): boolean {
    return (node.children?.length ?? 0) > 0 || node.hasChildren === true || node.loading === true;
  }

  canMove(nodeId: string, direction: -1 | 1): boolean {
    return (
      this.canEdit() &&
      this.field.fieldConfig.treeConfig?.allowMoveNode !== false &&
      canMoveTreeNode(this.nodes, nodeId, direction)
    );
  }

  duplicateNode(nodeId: string): void {
    if (!this.canEdit()) {
      return;
    }
    this.field.setValue(duplicateTreeNode(this.nodes, nodeId));
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
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.field.setValue(removeTreeNode(this.nodes, nodeId));
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
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) {
        this.advancedJsonError.set('shared.tree.invalidJsonArray');
        return;
      }
      const normalized = normalizeJsonTreeNodes(parsed);
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

  canSelectNode(node: TreeFormNode): boolean {
    return this.hasCheckboxSelection && this.canEdit() && isTreeNodeSelectable(node);
  }

  private expandPathToNode(nodeId: string): void {
    const path = findTreeNodePath(this.nodes, nodeId);
    if (!path) {
      return;
    }
    const next = new Set(this.collapsedNodeIds());
    path.slice(0, -1).forEach((id) => next.delete(id));
    this.collapsedNodeIds.set(next);
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
}
