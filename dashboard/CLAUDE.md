# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm install` — install dependencies
- `npm run dev` — start Vite dev server on port 3000 (auto-opens browser)
- `npm run build` — production build to `build/` directory

No test runner or linter is configured.

## Project Overview

SparkTask is a SaaS cleaning service dashboard built with React 18 + TypeScript + Vite. It originated from a Figma design export ([source](https://www.figma.com/design/5aILlbWcbb3W22gyJiILES/SaaS-Cleaning-Service-Dashboard)). There is no router — navigation is managed via state in `App.tsx` and `Dashboard.tsx`.

## Architecture

### Navigation Flow

`App.tsx` controls top-level views (login, register, forgot-password, register-cleaner, dashboard) using `useState`. User session is persisted in `localStorage` under `sparkTaskUser`.

`Dashboard.tsx` manages all authenticated pages via a `currentPage` state of type `PageType`. The `Sidebar` component drives navigation by calling `onPageChange`. Pages are rendered by a `switch` statement in `renderPage()`.

### Component Layout

- `src/components/` — feature components (Login, Register, Dashboard, Sidebar, etc.)
- `src/components/pages/` — page-level components rendered inside Dashboard
- `src/components/orders/` — order-related components (OrdersList, CreateOrderDialog, OrderDetailDialog)
- `src/components/ui/` — shadcn/ui primitives (Radix-based). `utils.ts` contains the `cn()` helper for merging Tailwind classes.
- `src/components/figma/` — Figma export helpers (ImageWithFallback)
- `src/data/` — mock data files (mockOrders, mockServices, mockAreas, etc.)

### Path Alias

`@` is aliased to `./src` in `vite.config.ts`.

### Styling

Tailwind CSS with the brand color `#033620` (dark green) used throughout for active states, buttons, and the logo. Components use `cn()` from `src/components/ui/utils.ts` for conditional class merging.

### Dual-Mode Components (Mock ↔ API)

Key components (Login, OrdersList, CreateOrderDialog) support dual-mode operation: they use mock data by default but accept optional props (`onSubmit`, `orders`) to connect to a real API. See `src/guidelines/API_Integration_Guide.md` for prop signatures and integration patterns.

### Order Edit Rules

Orders are only editable when status is `scheduled`. All other statuses (in-progress, completed, canceled) render read-only views. Canceled orders can be deleted. The `canEdit` and `canDelete` flags in `OrderDetailPage.tsx` control this. See `src/guidelines/ORDER_EDIT_RESTRICTION.md`.

### Sidebar Structure

The sidebar groups Services (Service Types, Areas & Checklist, Add-ons) and Settings (Account, General, Renewal Center) into collapsible dropdown menus that auto-expand when the user is on a child page.

## Conventions

- Icons: `@heroicons/react/24/solid` for sidebar/navigation, `lucide-react` for UI components
- UI primitives: shadcn/ui pattern with Radix UI + Tailwind + `class-variance-authority`
- Add JSDoc comments to new or undocumented functions
