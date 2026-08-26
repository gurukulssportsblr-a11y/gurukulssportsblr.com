---
name: Elite Athleticism
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
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
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is engineered for a premier sports destination, balancing the discipline of professional athletics with modern hospitality. It targets active professionals and families in a tech-centric urban environment, requiring a UI that feels reliable, high-performance, and incredibly efficient.

The aesthetic follows a **Corporate Modern** approach with **Minimalist** tendencies. It prioritizes clarity through high-contrast typography and a rigid structural grid. The interface should evoke an emotional response of "readiness" and "trust," utilizing significant whitespace to prevent information overload during the booking process. The visual language is sharp, avoiding excessive ornamentation to ensure the user's focus remains on court availability and facility excellence.

## Colors

The palette is anchored by **Midnight Blue**, providing a sophisticated and authoritative foundation for navigation and structural headers. This is contrasted against a clean **White (#FFFFFF)** and **Slate (#F8FAFC)** background system to maintain an airy, premium feel.

- **Primary (Midnight):** Used for global navigation, footers, and primary headings to establish hierarchy.
- **Secondary (Royal Blue):** Reserved for interactive states, progress indicators, and primary calls to action.
- **Tertiary (Emerald):** A semantic color specifically utilized for "Available" statuses, success confirmations, and positive reinforcement.
- **Neutral/Borders:** We use a strict 1px border logic with #E2E8F0 to define surfaces without relying on heavy shadows.

## Typography

This design system employs a dual-font strategy. **Plus Jakarta Sans** is used for headings and display elements to provide a modern, energetic, and slightly "athletic" personality. Its geometric nature scales beautifully for large-scale marketing headlines.

**Inter** is utilized for all body copy, inputs, and utility labels. Its high legibility and neutral tone are essential for data-heavy sections like court scheduling tables and membership pricing tiers. For all uppercase labels, a slight letter-spacing of 0.05em should be applied to enhance readability in small sizes.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **single-column fluid layout** for mobile devices. A strict 8px base unit (linear scale) governs all spacing decisions to ensure vertical rhythm.

- **Desktop (1440px+):** 12 columns, 24px gutters, 48px side margins.
- **Tablet (768px - 1023px):** 8 columns, 16px gutters, 32px side margins.
- **Mobile (Up to 767px):** 4 columns, 16px gutters, 16px side margins.

Section vertical spacing should be generous (stack-lg) to emphasize the premium, spacious feel of the physical complex. Content within cards should follow the `stack-sm` or `stack-md` rhythm.

## Elevation & Depth

This design system favors **Low-contrast Outlines** over heavy shadows to maintain a clean, professional aesthetic. Depth is communicated primarily through subtle background shifts between the page (#F8FAFC) and the component surfaces (#FFFFFF).

- **Flat Layer:** Default background (#F8FAFC).
- **Surface Layer:** White cards with a 1px border of #E2E8F0.
- **Raised State:** On hover, cards may transition to a very soft, diffused ambient shadow (0px 4px 20px rgba(15, 23, 42, 0.05)) to indicate interactivity.
- **Interactive Depth:** Buttons use solid color fills without gradients, relying on color intensity (Secondary vs. Primary) to show hierarchy rather than physical height.

## Shapes

The shape language is a mix of geometric precision and organic approachability. 
- **Cards and Containers:** Use `rounded-xl` (1.5rem / 24px) to soften the professional tone and make the UI feel modern and inviting.
- **Interactive Elements:** Buttons, tags, and pills use `rounded-full` (999px) to provide a distinct "active" look that contrasts with the structural layout.
- **Input Fields:** Utilize `rounded-lg` (1rem / 16px) for a balanced look that sits between the cards and the buttons.

## Components

### Buttons & Pills
- **Primary Action:** `rounded-full`, Background: #2563EB, Text: #FFFFFF. High-intensity blue for booking triggers.
- **Navigation/Header Actions:** `rounded-full`, Background: #0F172A, Text: #FFFFFF.
- **Status Chips:** `rounded-full`, Background: Emerald (#10B981) at 10% opacity with Emerald text for "Available."

### Cards
- **Facility/Court Cards:** White background, 1px #E2E8F0 border, `rounded-xl`. Padding should be consistent at 24px. Images should have a top-rounded-xl radius to match the container.

### Input Fields
- **Search/Booking Inputs:** 1px #E2E8F0 border, `rounded-lg`. On focus, the border transitions to #2563EB with a 2px outer glow of the same color at 10% opacity.

### Lists & Scheduling
- **Slot Lists:** Horizontal scrolling or grid-based layout. Use "Secondary Blue" for the selected slot and "Emerald Green" for available slots.
- **Typography in Lists:** Use `label-md` for headers and `body-md` for descriptions.

### Special Components
- **Booking Sticky Bar:** A bottom-anchored mobile bar or right-aligned desktop sidebar that summarizes the selection, using the Midnight Blue (#0F172A) for the total price display to ensure high trust and visibility.