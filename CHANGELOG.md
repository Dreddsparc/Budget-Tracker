# Changelog

All notable changes to Budget Tracker are documented here. This file covers the current release. For full history by version, see the [changelogs/](changelogs/) directory.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project uses [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Fixed
- Spreadsheet import now auto-creates missing transfer target accounts instead of silently dropping transfer links
- Spreadsheet import validates `forecastExpenseId` on actual spending records — orphaned links from DB resets import gracefully as unlinked entries

---

## [1.2] - 2026-03-31

See full details: [changelogs/v1.2.md](changelogs/v1.2.md)

### Added
- Actual spending tracker with optional forecast linking
- Fullscreen chart mode with click-to-zoom and range sliders
- Chart-specific display controls (Area/Line, Grouped/Stacked, Donut/Full Pie, Stacked/Individual)
- In-app help system with 11 contextual topic guides
- Category management modal with colors, descriptions, rename, and delete
- Category picker dialog for expense forms
- Actual Spending sheet in spreadsheet export/import
- Category descriptions in spreadsheet export/import
- `isTransfer` flag on projection events — spending charts exclude transfers
- Collapsible panels with current-month totals (interval-aware calculation)
- Docker Desktop setup instructions for macOS and Windows 11
- GitHub Pages landing site with privacy-first messaging
- CONTRIBUTING.md with guidelines and privacy principles
- Comprehensive documentation: 12 user guides, 10 developer guides

### Fixed
- Balance date preserved on spreadsheet import (was always using current date)
- `formatDate` handles full ISO strings (fixed "ends Invalid Date" display bug)
- Nested button HTML errors in collapsible panel headers
- SVG gradient ID collisions between normal and fullscreen chart instances

---

## [1.0] - 2026-03-28

See full details: [changelogs/v1.0.md](changelogs/v1.0.md)

### Added
- Multi-account management (create, rename, delete, switch)
- Inter-account transfers (expense in source, income in target)
- Day-by-day balance projection engine with 7 interval types
- 5 interactive chart views (Projection, Spending by Category, Income vs Expenses, Cash Flow, Expense Trends)
- Ledger view with filters, search, and summary statistics
- Variable expense pricing with date-based price adjustments
- What-if analysis via toggle overrides
- Excel spreadsheet export/import with 6 sheets
- Category system with custom colors
- Date range selection (presets + custom picker)
- Docker Compose orchestration (one-command setup)

---

[Unreleased]: https://github.com/Dreddsparc/Budget-Tracker/compare/v1.2...HEAD
[1.2]: https://github.com/Dreddsparc/Budget-Tracker/compare/v1.0...v1.2
[1.0]: https://github.com/Dreddsparc/Budget-Tracker/releases/tag/v1.0
