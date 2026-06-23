---
name: Kinetic Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4a3d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7b6c'
  outline-variant: '#bccbb9'
  surface-tint: '#006e2f'
  primary: '#006e2f'
  on-primary: '#ffffff'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#4ae176'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#5c5f61'
  on-tertiary: '#ffffff'
  tertiary-container: '#a9acae'
  on-tertiary-container: '#3d4042'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system embodies a "Precision-Modernist" aesthetic, blending the clinical reliability of enterprise SaaS with the forward-leaning energy of artificial intelligence. It targets high-level decision-makers and technical operators who demand clarity, speed, and sophistication.

The visual narrative is built on **Modern Minimalism** with a **Glassmorphic** twist. It utilizes expansive white space, ultra-refined typography, and subtle depth to create a hierarchy that feels both breathable and data-dense. The emotional response is one of "Calculated Calm"—the UI never shouts; it guides. Borrowing from the "Linear" school of thought, the system prioritizes functional beauty through hairline borders, soft-focus blurs, and purposeful motion.

## Colors
This design system uses a high-utility palette rooted in "Enterprise White." 

- **Primary:** A vibrant "Neural Green" (#22C55E) derived from the logo, used sparingly for call-to-actions, status indicators, and subtle data visualizations.
- **Secondary/Text:** Deep "Ink Charcoal" (#0F172A) provides high-contrast legibility for primary headers and body text.
- **Neutral:** A range of Slate grays handle secondary information and structural borders, ensuring the interface feels layered rather than flat.
- **Surface Strategy:** The background is a clean #FFFFFF. Containers use #F8FAFC (Subtle Gray) with a 1px border of #E2E8F0 to define boundaries without heavy shadows.

## Typography
The typography system relies on **Inter** for its neutral, highly legible characteristics, ensuring data remains the hero. **Geist** is introduced for labels and technical data to provide a developer-centric, "pro-tool" feel.

The hierarchy is "Top-Heavy," with significant contrast between display headings and body text. Letter spacing is slightly tightened on headings to give a premium, editorial look, while body text maintains standard tracking for optimal long-form reading. Labels are always in uppercase with increased tracking to differentiate them from interactive elements.

## Layout & Spacing
The design system employs a **12-column Fluid Grid** for desktop, transitioning to a **4-column grid** for mobile. 

A strict **8pt spacing system** governs all internal element relationships. Consistent gutters of 24px ensure that even complex dashboards feel organized. For enterprise-grade density, the system allows for "Compact" and "Spacious" modes; however, the default "Spacious" mode (24px padding within cards) is preferred to maintain the premium, high-end feel. 

Margins are generous (32px+) on the edges of the viewport to frame the content as a gallery of information rather than a wall of data.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Backdrop Blurs** rather than traditional heavy shadows.

1.  **Level 0 (Base):** The #FFFFFF background.
2.  **Level 1 (Cards):** Slightly raised using a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.03)) and a 1px soft gray border.
3.  **Level 2 (Modals/Popovers):** Uses a **Glassmorphic** approach with a backdrop blur (20px) and a semi-transparent white fill (rgba(255, 255, 255, 0.8)). This maintains a sense of spatial awareness.
4.  **Level 3 (Tooltips):** Solid Deep Charcoal (#0F172A) to provide maximum contrast against the light UI.

## Shapes
The shape language is "Sophisticated Softness." By utilizing a **Rounded (Level 2)** approach, the UI feels approachable yet structured.

- **Buttons & Inputs:** 0.5rem (8px) corner radius.
- **Cards & Sections:** 1rem (16px) corner radius.
- **Large Layout Containers:** 1.5rem (24px) corner radius to create a distinct "app-within-a-browser" aesthetic.

Interactive elements like chips and tags may occasionally use "pill" shapes (full rounding) to distinguish them from structural components.

## Components
- **Buttons:** Primary buttons use the accent gradient with white text. Secondary buttons are ghost-style with a 1px border. All buttons utilize a subtle 100ms scale-down effect on click to provide tactile feedback.
- **Input Fields:** Use a #F8FAFC background that shifts to #FFFFFF on focus, highlighted by a 2px green outer ring.
- **Cards:** The core of the dashboard. They must include a subtle internal padding of 24px and use "Geist" for header labels.
- **Chips:** Small, low-contrast pills (Green background at 10% opacity with 100% opacity Green text) for status indicators like "Active" or "Processing."
- **Progress Bars:** Thin (4px height) with a glow effect on the leading edge of the Neural Green fill to imply energy and movement.
- **Navigation:** A vertical sidebar with semi-transparent hover states and "active" indicators using a vertical green line on the left edge.