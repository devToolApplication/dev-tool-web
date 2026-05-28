import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs';
import { PermissionService } from '../../../core/auth/permission.service';
import { environment } from '../../../../enviroment/environment';

export interface AppMenuItem extends MenuItem {
  badge?: string;
  hidden?: boolean;
  permissions?: readonly string[];
  shortcut?: string;
  groupColor?: string;
  items?: AppMenuItem[];
}

@Component({
  selector: 'app-side-menu',
  standalone: false,
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit {
  @Input() items: AppMenuItem[] = [];
  @Input() collapsed = false;
  @Output() navigate = new EventEmitter<void>();

  @ViewChild('menuSearchInput', { read: ElementRef }) menuSearchInputRef?: ElementRef<HTMLElement>;

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k' && !this.collapsed) {
      event.preventDefault();
      const input = this.menuSearchInputRef?.nativeElement?.querySelector?.('input');
      (input as HTMLElement | undefined)?.focus();
    }
  }

  readonly expandedState = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly currentUrl = signal('');
  readonly appVersion = 'v0.0.0';
  readonly environmentLabel = environment.production ? 'layout.environment.production' : 'layout.environment.development';

  private readonly expandedStorageKey = 'dev-tool.sidebarOpenGroups';
  private readonly defaultExpandedPaths = new Set([
    'root/layout.menu.systemManagement/layout.menu.systemConfigs',
    'root/layout.menu.systemManagement/layout.menu.secretManagement'
  ]);

  constructor(
    private readonly router: Router,
    private readonly destroyRef: DestroyRef,
    private readonly permissionService: PermissionService
  ) {
    this.currentUrl.set(this.normalizeUrl(this.router.url));
  }

  ngOnInit(): void {
    this.expandedState.set(this.readExpandedState());

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.currentUrl.set(this.normalizeUrl((event as NavigationEnd).urlAfterRedirects));
      });
  }

  isExpanded(path: string): boolean {
    return this.hasSearch() || this.expandedState().has(path);
  }

  toggle(path: string): void {
    this.expandedState.update((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      this.storeExpandedState(next);
      return next;
    });
  }

  onSearchChange(value: string | null): void {
    this.searchQuery.set(value ?? '');
  }

  visibleGroups(): AppMenuItem[] {
    return this.filterMenuItems(this.items, 'root', false);
  }

  hasSearch(): boolean {
    return this.searchQuery().trim().length > 0;
  }

  isItemActive(item: AppMenuItem): boolean {
    const itemUrl = this.itemUrl(item);

    if (itemUrl && this.isRoutePrefix(itemUrl, this.currentUrl())) {
      return true;
    }

    return item.items?.some((child) => this.isItemActive(child)) ?? false;
  }

  onNavigate(): void {
    this.navigate.emit();
  }

  onMenuKeydown(event: KeyboardEvent): void {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

    if (!keys.includes(event.key)) {
      return;
    }

    const root = event.currentTarget as HTMLElement;
    const focusableItems = Array.from(root.querySelectorAll<HTMLElement>('.menu-link:not([disabled])'));

    if (!focusableItems.length) {
      return;
    }

    event.preventDefault();
    const currentIndex = focusableItems.findIndex((item) => item === document.activeElement);
    const lastIndex = focusableItems.length - 1;
    let nextIndex = currentIndex;

    if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    } else if (event.key === 'ArrowDown') {
      nextIndex = currentIndex >= 0 ? Math.min(currentIndex + 1, lastIndex) : 0;
    } else if (event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : lastIndex;
    }

    focusableItems[nextIndex]?.focus();
  }

  trackMenuItem(index: number, item: AppMenuItem): string {
    return this.itemUrl(item) || item.label || String(index);
  }

  private filterMenuItems(items: AppMenuItem[], parentPath: string, includeDescendants: boolean): AppMenuItem[] {
    return items.reduce<AppMenuItem[]>((visibleItems, item) => {
      const itemPath = `${parentPath}/${item.label || 'item'}`;

      if (!this.canShowItem(item)) {
        return visibleItems;
      }

      const itemMatches = includeDescendants || !this.hasSearch() || this.itemMatchesSearch(item);
      const childItems = item.items?.length
        ? this.filterMenuItems(item.items, itemPath, itemMatches)
        : undefined;

      if (!itemMatches && !childItems?.length) {
        return visibleItems;
      }

      visibleItems.push({
        ...item,
        items: item.items?.length ? childItems ?? [] : undefined
      });

      return visibleItems;
    }, []);
  }

  private canShowItem(item: AppMenuItem): boolean {
    if (item.visible === false || item.hidden === true) {
      return false;
    }

    return !item.permissions?.length || this.permissionService.hasAll(item.permissions);
  }

  private itemMatchesSearch(item: AppMenuItem): boolean {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [item.label, this.itemUrl(item)]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .some((value) => value.toLowerCase().includes(query));
  }

  private itemUrl(item: AppMenuItem): string {
    const routerLink = item.routerLink;

    if (Array.isArray(routerLink)) {
      return this.normalizeUrl(routerLink.join('/'));
    }

    return typeof routerLink === 'string' ? this.normalizeUrl(routerLink) : '';
  }

  private normalizeUrl(url: string): string {
    const cleanUrl = String(url ?? '').split('?')[0].split('#')[0].trim();

    if (!cleanUrl) {
      return '';
    }

    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }

  private isRoutePrefix(candidate: string, url: string): boolean {
    return url === candidate || url.startsWith(`${candidate}/`);
  }

  private readExpandedState(): Set<string> {
    if (typeof localStorage === 'undefined') {
      return new Set(this.defaultExpandedPaths);
    }

    const storedValue = localStorage.getItem(this.expandedStorageKey);

    if (!storedValue) {
      return new Set(this.defaultExpandedPaths);
    }

    try {
      const parsedValue = JSON.parse(storedValue);

      if (Array.isArray(parsedValue)) {
        return new Set(parsedValue.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      return new Set(this.defaultExpandedPaths);
    }

    return new Set(this.defaultExpandedPaths);
  }

  private storeExpandedState(paths: Set<string>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.expandedStorageKey, JSON.stringify([...paths]));
  }
}
