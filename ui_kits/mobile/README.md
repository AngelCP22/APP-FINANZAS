# FinControl — Mobile UI Kit

## Overview
Interactive hi-fi prototype of the FinControl mobile app (iOS & Android PWA).
Recreates the original `systemWaska/finanzas` app with full dark/light mode support.

## Screens
| Screen | Description |
|--------|-------------|
| **Inicio** | Dashboard: balance hero, accounts summary, budget bars, recent transactions |
| **Cuentas** | Account cards with gradient colors, transfer action |
| **Deudas** | Credit card and loan management with utilization bars |
| **Metas** | Savings goals with progress tracking |
| **Resumen** | Bar charts, stat boxes, category breakdown |
| **Más** | Fixed expenses, full history, search |

## Interactions
- PIN lock screen (code: **1234**)
- Animated splash screen
- Bottom navigation with active state
- Month navigator (← →)
- Dark/light mode toggle (☀️/🌙 in topbar)
- FAB opens "Add Transaction" bottom sheet modal
- Tweaks panel: toggle theme, jump to any screen

## Usage
Open `index.html` in a browser. The app is constrained to a 390×844px phone frame and centered in the viewport, simulating an iPhone 14-sized device.

## Components
All components are inline in `index.html` using React + Babel:
- `BalanceHero` — Hero balance display
- `TxItem` — Transaction row
- `HomeScreen`, `AccountsScreen`, `DebtsScreen`, `GoalsScreen`, `StatsScreen`, `MoreScreen`
- `AddTxModal` — Bottom sheet for adding transactions
- `PinScreen` — PIN entry with dot indicators
