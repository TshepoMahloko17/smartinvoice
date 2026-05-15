---
name: Precision & Clarity
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ecedf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b24'
  on-surface-variant: '#424655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#eff0fc'
  outline: '#737686'
  outline-variant: '#c2c6d7'
  surface-tint: '#0055d3'
  primary: '#0052cb'
  on-primary: '#ffffff'
  primary-container: '#1d6af5'
  on-primary-container: '#fbf9ff'
  inverse-primary: '#b2c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#9e3a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c74b00'
  on-tertiary-container: '#fff9f8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb597'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7e2c00'
  background: '#faf8ff'
  on-background: '#191b24'
  surface-variant: '#e1e2ed'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-num:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  grid-gutter: 16px
---

## Brand & Style
The brand personality is rooted in efficiency, reliability, and modern financial management. The design system targets small business owners and finance professionals who require a tool that feels authoritative yet effortless to navigate. 

The aesthetic follows a **Corporate / Modern** style, characterized by generous whitespace, a structured layout, and a functional approach to density. The emotional response should be one of "controlled speed"—allowing users to generate, send, and track invoices without cognitive friction. Visual elements are kept crisp to ensure data clarity, while rounded corners and soft shadows prevent the interface from feeling overly rigid or institutional.

## Colors
The palette is dominated by a high-energy primary blue, which acts as the main signal for action and brand identity. This is supported by a neutral foundation: a cool-toned background and pure white surfaces to create clear visual separation.

Status colors are high-chroma to ensure critical information (like "Overdue" or "Paid") is immediately scannable. Neutral slates are used for secondary text and icons to maintain a sophisticated hierarchy that doesn't compete with primary actions.

## Typography
Inter is selected for its exceptional legibility in data-heavy environments. The typographic scale prioritizes clear information architecture, using weight and letter spacing to distinguish between navigational labels and financial figures.

For invoice amounts and tabular data, the `mono-num` style (using Inter's tabular lining features) must be used to ensure digits align vertically, aiding in quick financial comparison. Headlines use a tighter letter spacing to maintain a modern, "tucked" look.

## Layout & Spacing
The layout employs a **12-column fluid grid** for main content areas, transitioning to a fixed-width centralized view for the actual invoice document preview. 

A 4px baseline grid governs all internal component spacing, ensuring consistent rhythm. Vertical rhythm is established through 16px (md) and 24px (lg) increments. Page layouts should prioritize a "sidebar-and-stage" model, where the sidebar handles global navigation and the stage contains the primary work area with significant internal padding to prevent visual clutter.

## Elevation & Depth
Depth is achieved through **ambient shadows** and subtle tonal shifts. Surfaces do not use heavy borders; instead, they rely on soft, multi-layered shadows to indicate lift.

- **Level 0 (Background):** #F5F7FA.
- **Level 1 (Cards/Cards):** White background with a 10% opacity shadow, 4px Y-offset, and 12px blur.
- **Level 2 (Dropdowns/Modals):** White background with a 15% opacity shadow, 8px Y-offset, and 24px blur.

Interactive elements like buttons use a subtle inner-glow or a slight lift on hover to provide tactile feedback without breaking the clean, flat aesthetic.

## Shapes
The design system utilizes a **Rounded** shape language. This softens the mathematical nature of fintech data, making the product feel more accessible and user-friendly.

All standard components (inputs, buttons, small cards) use a 0.5rem (8px) corner radius. Large containers or dashboard "widgets" should scale up to a 1rem (16px) radius to maintain visual harmony with their larger surface area.

## Components

### Buttons
Primary buttons use the primary blue with white text. Secondary buttons use a light gray ghost style or a subtle outline. Buttons must have a minimum height of 44px for touch-ready interactions.

### Inputs & Selects
Input fields feature a 1px border (#E2E8F0) and transition to the primary blue on focus. Error states are signaled by a red border and a small supporting text label below the field. Labels should always be visible above the input.

### Status Chips
Used for invoice statuses (Paid, Pending, Overdue). These use a "subtle fill" approach: a 10% opacity background of the status color with high-contrast text of the same hue (e.g., Light Green background with Dark Green text).

### Invoicing Cards
The primary container for invoice summaries. These cards feature the standard roundedness and shadow, containing a header for the client name, a body for the amount, and a footer for the due date and status chip.

### Data Tables
Clean rows with 1px horizontal dividers. Avoid vertical borders. The header row should be slightly tinted (#F8FAFC) to distinguish it from the data entries. Inter's tabular numbers are mandatory for the "Amount" column.