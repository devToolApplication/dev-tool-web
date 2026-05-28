import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';

export function provideSharedTesting(): Array<Provider | EnvironmentProviders> {
  installMatchMediaMock();
  installResizeObserverMock();
  installRangeGeometryMock();

  return [
    provideHttpClient(),
    provideNoopAnimations(),
    provideRouter([], withHashLocation())
  ];
}

function installRangeGeometryMock(): void {
  if (typeof document === 'undefined' || typeof document.createRange !== 'function') {
    return;
  }

  const range = document.createRange();
  const rangePrototype = Object.getPrototypeOf(range) as Range | undefined;

  if (!rangePrototype || typeof rangePrototype.getClientRects === 'function') {
    return;
  }

  Object.defineProperty(rangePrototype, 'getClientRects', {
    configurable: true,
    value: () => ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* iterator() {}
    })
  });

  Object.defineProperty(rangePrototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({})
    })
  });
}

function installResizeObserverMock(): void {
  if (typeof window === 'undefined' || typeof window.ResizeObserver === 'function') {
    return;
  }

  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock
  });

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock
  });
}

function installMatchMediaMock(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'function') {
    return;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}
