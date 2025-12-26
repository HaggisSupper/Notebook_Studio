# Test Outputs Directory

This directory stores all outputs generated during testing of Notebook Studio.

## Directory Structure

### Content Output Directories

- **`/reports/`** - Generated report outputs at all complexity levels
- **`/dashboards/`** - Dashboard generation outputs
- **`/infographics/`** - Infographic outputs
- **`/mindmaps/`** - Mindmap outputs (tree and Mermaid formats)
- **`/flashcards/`** - Flashcard generation outputs
- **`/slides/`** - Presentation slide outputs
- **`/tables/`** - Table generation outputs
- **`/canvas/`** - Canvas editor outputs (Markdown and Mermaid)
- **`/chat_logs/`** - Chat conversation logs
- **`/sql_transforms/`** - SQL transform log exports

### `/Screenshots/`
Organized by category for UI testing documentation.

#### Subdirectories:
- **`navigation/`** - Navigation menu and view switching
- **`modals/`** - Modal dialog screenshots
- **`views/`** - Content view screenshots
- **`interactions/`** - Interactive element states (hover, focus, etc.)
- **`responsive/`** - Mobile and responsive design screenshots

## File Naming Conventions

### Content Outputs

**Format**: `{view_type}_{complexity_level}_{test_id}.{ext}`

**Examples**:
- `report_simple_FUNC-REPORT-001.md`
- `dashboard_comprehensive_FUNC-DASH-002.html`
- `table_detailed_INT-SQL-003.md`

### SQL Transform Logs

**Format**: `transform_log_{test_id}_{timestamp}.json`

**Example**:
- `transform_log_INT-SQL-001_20241226_143022.json`

### Screenshots

**Format**: `{category}_{feature}_{action}_{test_id}.png`

**Examples**:
- `navigation_main_menu_active_UI-NAV-002.png`
- `modal_settings_open_UI-MODAL-001.png`
- `view_report_comprehensive_FUNC-REPORT-004.png`
- `interactions_button_hover_UI-HOVER-001.png`
- `responsive_mobile_navigation_UI-RESP-001.png`

## Complexity Level Suffixes

Each content generation feature should have outputs for all levels:

| Level | Suffix | Expected Characteristics |
|-------|--------|--------------------------|
| Simple | `_simple` | Minimal, concise, essential information |
| Standard | `_standard` | Balanced detail, typical use case |
| Detailed | `_detailed` | In-depth, comprehensive analysis |
| Comprehensive | `_comprehensive` | Exhaustive, maximum depth |

## Usage

### Saving Content Outputs

1. Generate content in the application
2. Copy/export the output
3. Save to the appropriate directory with correct naming
4. Update test case documentation with file path

### Capturing Screenshots

1. Navigate to the feature/state to capture
2. Use browser screenshot tools or Playwright
3. Save with descriptive naming to appropriate subdirectory
4. Reference in test case documentation

### Exporting SQL Transform Logs

1. Open SQL Bridge modal
2. Click "Export Log" button
3. Save to `/sql_transforms/` with test ID in filename
4. Validate JSON structure

## Validation

### Output Quality Checks

For each generated output, verify:
- [ ] Content is coherent and relevant
- [ ] Formatting is appropriate
- [ ] Complexity level matches expectations
- [ ] All sources are incorporated
- [ ] Output length is reasonable

### Screenshot Quality Checks

For each screenshot, verify:
- [ ] Clear and readable
- [ ] Captures intended UI element/state
- [ ] Proper resolution (minimum 1920x1080 for desktop)
- [ ] Correct naming convention
- [ ] Referenced in test documentation

## Maintenance

### Regular Tasks

1. **Archive Old Outputs**: Move completed test outputs to dated archive folders
2. **Review File Sizes**: Ensure outputs don't consume excessive disk space
3. **Validate Links**: Check that test documentation correctly references outputs
4. **Cleanup Duplicates**: Remove redundant or superseded outputs

### Storage Guidelines

- Keep outputs for the current test cycle
- Archive previous test cycle outputs
- Delete outputs older than 6 months unless needed for reference
- Compress large files (videos, high-res images)

## Integration with Test Reports

All test outputs should be referenced in:
1. Individual test case documentation
2. Test run reports (`/Test Reports/`)
3. Master test log (`/Test Inputs/test_log.json`)

## File Format Standards

### Markdown Files (`.md`)
- Use for text-based outputs (reports, tables, etc.)
- Include metadata header with test ID and date
- Follow consistent formatting

### JSON Files (`.json`)
- Use for structured data (logs, exports)
- Validate JSON structure before saving
- Pretty-print with 2-space indentation

### Image Files (`.png`)
- Use PNG format for screenshots
- Optimize file size while maintaining clarity
- Include dimensions in filename if relevant

---

*Last Updated: 2024-12-26*
