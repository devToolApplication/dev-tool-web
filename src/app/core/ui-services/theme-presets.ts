import { definePreset } from '@primeuix/themes';
import type { Preset } from '@primeuix/themes/types';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import Material from '@primeuix/themes/material';

export type ThemePresetId = 'aura' | 'lara' | 'nora' | 'material';

type SurfaceScale = {
  0: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

const withAppColorScheme = (basePreset: Preset, darkSurface: SurfaceScale) =>
  definePreset(basePreset, {
    semantic: {
      primary: {
        50: '{indigo.50}',
        100: '{indigo.100}',
        200: '{indigo.200}',
        300: '{indigo.300}',
        400: '{indigo.400}',
        500: '{indigo.500}',
        600: '{indigo.600}',
        700: '{indigo.700}',
        800: '{indigo.800}',
        900: '{indigo.900}',
        950: '{indigo.950}'
      },
      colorScheme: {
        light: {
          primary: {
            color: '{primary.600}',
            inverseColor: '#ffffff'
          },
          surface: {
            0: '#ffffff',
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617'
          },
          text: {
            color: '{surface.700}',
            mutedColor: '{surface.500}'
          },
          content: {
            background: '{surface.0}',
            hoverBackground: '{surface.50}',
            borderColor: '{surface.200}',
            color: '{surface.700}'
          },
          formField: {
            background: '{surface.0}',
            borderColor: '{surface.300}',
            hoverBorderColor: '{primary.color}',
            focusBorderColor: '{primary.color}',
            color: '{surface.700}',
            placeholderColor: '{surface.400}'
          }
        },
        dark: {
          primary: {
            color: '{primary.300}',
            inverseColor: '#000000'
          },
          surface: darkSurface,
          text: {
            color: '{surface.950}',
            mutedColor: '{surface.700}'
          },
          content: {
            background: '{surface.100}',
            hoverBackground: '{surface.200}',
            borderColor: '{surface.300}',
            color: '{surface.900}'
          },
          formField: {
            background: '{surface.50}',
            borderColor: '{surface.300}',
            hoverBorderColor: '{primary.color}',
            focusBorderColor: '{primary.color}',
            color: '{surface.950}',
            placeholderColor: '{surface.600}'
          },
          overlay: {
            select: {
              background: '{surface.100}',
              borderColor: '{surface.300}',
              color: '{surface.900}'
            },
            popover: {
              background: '{surface.100}',
              borderColor: '{surface.300}',
              color: '{surface.900}'
            },
            modal: {
              background: '{surface.100}',
              borderColor: '{surface.300}',
              color: '{surface.900}'
            }
          }
        }
      }
    }
  });

export const APP_THEME_PRESETS: Record<ThemePresetId, Preset> = {
  aura: withAppColorScheme(Aura, {
    0: '#0d1438',
    50: '#151f4f',
    100: '#212f79',
    200: '#3147a9',
    300: '#455fd7',
    400: '#5f7dff',
    500: '#829cff',
    600: '#a6bcff',
    700: '#c6d4ff',
    800: '#dfe7ff',
    900: '#eef2ff',
    950: '#ffffff'
  }),
  lara: withAppColorScheme(Lara, {
    0: '#111437',
    50: '#1b2052',
    100: '#2a317d',
    200: '#3d48ae',
    300: '#5463da',
    400: '#6e80ff',
    500: '#909fff',
    600: '#b4beff',
    700: '#cfd7ff',
    800: '#e4e9ff',
    900: '#f2f4ff',
    950: '#ffffff'
  }),
  nora: withAppColorScheme(Nora, {
    0: '#0b261f',
    50: '#10362d',
    100: '#184c3f',
    200: '#216a57',
    300: '#2b886f',
    400: '#35a888',
    500: '#55c3a1',
    600: '#7fd8bb',
    700: '#acead4',
    800: '#d2f5e7',
    900: '#eafbf4',
    950: '#ffffff'
  }),
  material: withAppColorScheme(Material, {
    0: '#0c1733',
    50: '#12224b',
    100: '#1c3373',
    200: '#29489f',
    300: '#385fcb',
    400: '#4c79f6',
    500: '#6f97ff',
    600: '#95b6ff',
    700: '#bdd3ff',
    800: '#dbe7ff',
    900: '#edf3ff',
    950: '#ffffff'
  })
};
