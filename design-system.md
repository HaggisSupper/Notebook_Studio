# Gen-X Dark Interface Design System
## Notebook Studio - UI/UX Specification

### Design Philosophy
This design system prioritizes **clarity over novelty** and **predictability over flash**, optimized for Gen-X primary users with focus on:
- Reduced cognitive load
- Ergonomic efficiency  
- Dark-mode comfort for extended use
- Keyboard-first and mouse-first interactions
- High usability with low learning curve

---

## Color Palette

### Base Monochrome
- **Background Primary**: `#1E1E1E` (VSCode dark background)
- **Background Secondary**: `#252526` (Elevated surfaces)
- **Background Tertiary**: `#2D2D30` (Inputs, cards)
- **Border Default**: `#3E3E42` (Subtle dividers)
- **Border Emphasis**: `#454545` (Interactive boundaries)

### Text Colors
- **Text Primary**: `#CCCCCC` (Body text, AAA compliant)
- **Text Secondary**: `#999999` (Labels, metadata)
- **Text Disabled**: `#666666` (Inactive states)
- **Text Emphasis**: `#FFFFFF` (Headings, focus)

### Accent Colors

#### Orange Glow (Controls & CTAs)
- **Base**: `#FF6B35` (Primary orange)
- **Hover**: `#FF8556` (Lighter on hover)
- **Active**: `#E55A28` (Darker when pressed)
- **Glow**: `rgba(255, 107, 53, 0.4)` (Box shadow)

#### Teal Glow (Conversational & Output)
- **Base**: `#14B8A6` (Teal-500)
- **Hover**: `#2DD4BF` (Lighter on hover)
- **Active**: `#0F9688` (Darker when pressed)
- **Glow**: `rgba(20, 184, 166, 0.4)` (Box shadow)

#### Status Colors
- **Success**: `#4ADE80` (Green-400)
- **Warning**: `#FBBF24` (Amber-400)
- **Error**: `#F87171` (Red-400)
- **Info**: `#60A5FA` (Blue-400)

---

## Typography

### Font Stack
```css
font-family: 'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, 
             'Source Sans 3', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale (Base: 16px / 1rem)
- **Display**: 32px / 2rem - Bold - Headings
- **Title**: 24px / 1.5rem - Bold - Section titles
- **Large Body**: 18px / 1.125rem - Regular - Emphasized content
- **Body**: 16px / 1rem - Regular - Default text
- **Small**: 14px / 0.875rem - Regular - Metadata
- **Tiny**: 12px / 0.75rem - Regular - Labels

### Line Heights
- Display: 1.2
- Title: 1.3
- Body: 1.6 (optimal readability)
- Small/Tiny: 1.5

### Font Weights
- **Regular**: 400 (Body text)
- **Medium**: 500 (UI controls)
- **Semibold**: 600 (Subheadings)
- **Bold**: 700 (Headings, emphasis)

---

## Spacing System

### Scale (Based on 8px grid)
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

### Touch Targets
- Minimum: 44x44px (WCAG AAA)
- Recommended: 48x48px for primary actions
- Desktop buttons: Minimum 36px height

---

## Motion & Animation

### Durations
- **Instant**: 0ms (Immediate feedback)
- **Fast**: 100ms (Micro-interactions)
- **Normal**: 150ms (Standard transitions)
- **Slow**: 200ms (Max allowed, for large changes)

### Easing Functions
- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- **Enter**: `cubic-bezier(0, 0, 0.2, 1)` (deceleration)
- **Exit**: `cubic-bezier(0.4, 0, 1, 1)` (acceleration)

### Allowed Transitions
- ✅ Fade (opacity)
- ✅ Slide (translate)
- ✅ Scale (subtle, 0.95-1.05 range only)
- ❌ Bounce
- ❌ Spring
- ❌ Parallax
- ❌ Rotation (except icons)

---

## Component Patterns

### Primary Button (CTA)
- Background: Orange accent
- Text: White, bold, 14px
- Padding: 12px 24px
- Border radius: 6px
- Hover: Lighten + orange glow
- Focus: 2px orange outline + stronger glow

### Secondary Button
- Background: Transparent
- Border: 2px Border Emphasis
- Text: Text Primary, medium, 14px
- Hover: Border orange + text white
- Focus: Orange outline + glow

### Input Fields
- Background: Background Tertiary
- Border: 2px Border Default
- Text: Text Primary, 16px
- Padding: 12px 16px
- Hover: Border orange (subtle)
- Focus: Border orange + orange glow
- Label: Text Secondary, 12px, uppercase, tracking wide

### Chat Interface
- Background: Background Secondary with teal accent
- Messages: Teal glow on assistant messages
- Input: Teal border on focus
- Send button: Teal accent

---

## Accessibility Requirements

### Contrast Ratios (WCAG AAA)
- Normal text: 7:1 minimum
- Large text (18px+ or 14px+ bold): 4.5:1 minimum
- UI components: 3:1 minimum

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Visible focus indicators required (2px outline + glow)
- Logical tab order
- Skip links for main content
- Escape key closes modals/overlays

### Screen Readers
- Semantic HTML elements
- ARIA labels for icon buttons
- Role attributes where needed
- Live regions for dynamic content

### Scalability
- Support browser zoom up to 200%
- Relative units (rem/em) for typography
- No fixed pixel heights that break with zoom
- Responsive breakpoints maintain readability

---

## Layout Principles

### Grid System
- Desktop: 12-column grid
- Tablet: 8-column grid  
- Mobile: 4-column grid
- Gutter: 24px
- Margin: 32px (desktop), 16px (mobile)

### Alignment
- Body text: Left-aligned
- UI controls: Center-aligned (text within buttons)
- Numbers: Right-aligned in tables
- Headings: Left-aligned

### White Space
- Never crowd content - breathing room is essential
- Minimum padding inside containers: 24px
- Minimum spacing between sections: 48px
- Minimum spacing between related items: 16px

---

## Interaction Patterns

### Destructive Actions
- **Confirmation required** (modal dialog)
- Red accent color
- Explicit action labels ("Delete", not "OK")
- Undo option within 10 seconds where possible

### Auto-save
- Enabled by default
- Visual indicator (subtle, non-intrusive)
- Last saved timestamp
- Error recovery on crash

### Loading States
- Progress indicators for >300ms operations
- Skeleton screens for content loading
- Disable buttons during processing
- Clear status messages

### Empty States
- Helpful illustrations or icons
- Clear explanation of state
- Primary action to resolve
- Educational content when appropriate

---

## Power User Features

### Keyboard Shortcuts
- Global shortcuts always visible in menu
- Common patterns: Ctrl+S (save), Ctrl+N (new), etc.
- Command palette (Ctrl+K)
- No more than 2-key combinations

### Persistent Controls
- Primary actions always visible
- No hiding behind hamburger menus
- Breadcrumb navigation
- Sidebar pinning option

---

## RUBRIC SCORING FRAMEWORK

### 1. Usability & Affordances (40%)
- Controls recognizable at a glance
- Labeled actions rather than icons-only
- Predictable placement, persistent access
- Target: 0.40/0.40

### 2. Legibility, Typography & Contrast (25%)
- Large-body readability
- AAA contrast where possible
- Spacing & alignment for aging eyes
- Target: 0.25/0.25

### 3. Cognitive Load & Simplicity (20%)
- Reduces mental effort
- Minimizes hidden navigation
- No unnecessary steps
- Target: 0.20/0.20

### 4. Demographic Alignment (15%)
- Gen-X expectations: durability > novelty
- Avoids trend-first design
- Ergonomic, low-friction mental model
- Target: 0.15/0.15

**Acceptance Threshold: RUBRIC_SCORE ≥ 0.9998**

---

## Implementation Notes

This design system should be applied consistently across all components:
- App.tsx (main layout)
- Sidebar.tsx (navigation)
- All view components (Report, Dashboard, etc.)
- Modal components
- Form inputs
- Chat interface

All changes should maintain backward compatibility while significantly improving usability for the target demographic.
