export type UiRouterLink = string | readonly unknown[];

export interface UiBreadcrumbItem {
  label: string;
  routerLink?: UiRouterLink;
}
