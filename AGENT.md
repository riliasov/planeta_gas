# AGENT Handover Protocol

## Project: Planeta GAS (Google Apps Script)

### 🚀 Context & Status
The project controls a swimming pool booking system via Google Sheets + Custom Sidebar.
We have just completed a **major refactoring** (Migration to JSON-based architecture).

**Current State:**
- **Architecture**: Separated into `Repositories` (Data), `Services` (Business Logic), and `UI` (Sidebar).
- **Data**: All interactions via mapped JSON objects defined in `constants.gs`. No column indexes in services!
- **Sync**: Local development → `clasp` → Google Apps Script.
- **Validation**: Schema validation active (`schemaValidator.gs`).

### 🏗 Architecture Overview

#### 1. Data Layer (Repositories)
- **Base**: `BaseRepository.gs`
- **Entities**: `ClientRepository`, `ScheduleRepository`, `SalesRepository`, `EmployeeRepository`, etc.
- **Contract**: All column mappings are in `constants.gs`.
- **Pattern**: `mapRowToModel(row)` ↔ `mapModelToRow(model)`.

#### 2. Service Layer
- `bookingService.gs`: Logic for creating/updating bookings, conflict checks.
- `clientService.gs`: Client history, lookup.
- `salesService.gs`: Processing sales.
- **Rule**: NEVER call `SpreadsheetApp` directly here. Use Repositories.

#### 3. UI Layer
- `sidebar.html`: Styles (Vanilla CSS), Logic (Vanilla JS).
- `ui.gs`: Backend handlers for the frontend.

### 🛠 Tools & Workflow
1.  **Sync**: Always use `./sync_to_gas.sh -f` to push changes.
2.  **Logs**: Use `LogService` or `console.log` (viewable in Stackdriver).
3.  **Tests**: `repositoryTests.gs` (Unit), `diagnosticTests.gs` (Integration/Debug).

### 🚨 Critical Rules for Agent
1.  **No Magic Numbers**: Use `constants.gs` for everything (column indexes, sheet names).
2.  **Safety**: UUIDs are used for PKs.
3.  **Style**: JSON-first. Do not return raw arrays to the UI.
4.  **Confirm Changes**: Always verify potentially destructive changes or large refactors with the user first.

### 📝 Backlog / Next Steps
- Monitor `getStaff` (EmployeeRepository) - we added a fallback to fetch all employees if trainers aren't found.
- Verify tasks rendering in UI (Columns G & H).
