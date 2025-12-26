# Comprehensive Test Plan for Notebook Studio

**Version:** 1.0  
**Date:** December 26, 2024  
**Project:** Notebook Studio  
**Repository:** HaggisSupper/Notebook_Studio

---

## Table of Contents

1. [Purpose of the Test Plan](#1-purpose-of-the-test-plan)
2. [Scope](#2-scope)
3. [Test Environment and Infrastructure](#3-test-environment-and-infrastructure)
4. [Folder Structure](#4-folder-structure)
5. [Unique Test Identifiers](#5-unique-test-identifiers)
6. [Test Case Documentation Standards](#6-test-case-documentation-standards)
7. [Test Categories](#7-test-categories)
8. [Automated vs Manual Tests](#8-automated-vs-manual-tests)
9. [Test Case Inventory](#9-test-case-inventory)
10. [Test Execution Process](#10-test-execution-process)
11. [Test Report Template](#11-test-report-template)
12. [Compliance and Premium Requirements](#12-compliance-and-premium-requirements)
13. [Success Criteria](#13-success-criteria)
14. [Appendices](#14-appendices)

---

## 1. Purpose of the Test Plan

### 1.1 Objective

This test plan establishes a comprehensive testing framework for Notebook Studio to ensure:

1. **Functionality Validation**: All features and components work as designed
2. **Output Level Testing**: All output settings at various levels (Simple, Standard, Detailed, Comprehensive) produce appropriate results
3. **UI Component Verification**: User interface elements function correctly and are visually consistent
4. **Feature Compliance**: Application meets baseline feature requirements
5. **Premium Feature Evaluation**: Identifies gaps between current implementation and premium/enterprise-grade features
6. **Traceability**: Clear documentation and screenshots for all test outcomes

### 1.2 Goals

- Achieve 80%+ code coverage through automated testing
- Document all manual test procedures with clear acceptance criteria
- Capture UI screenshots for all major features and interactions
- Maintain a comprehensive test log in JSON format for traceability
- Provide actionable recommendations for feature compliance and premium enhancements

---

## 2. Scope

### 2.1 Features to Test

#### Core Functionality
- Notebook and page management (create, rename, delete, navigate)
- Source management (add, remove, reorder, undo/redo)
- File upload and ingestion (all supported formats)
- Content generation across all view types
- Settings and configuration management

#### View Types
1. **REPORT** - Comprehensive report generation
2. **DASHBOARD** - Data visualization and metrics
3. **INFOGRAPHIC** - Visual data presentation
4. **MINDMAP** - Concept mapping (Tree and Mermaid views)
5. **FLASHCARDS** - Study material generation
6. **SLIDES** - Presentation content
7. **TABLE** - Data tables and SQL query results
8. **CANVAS** - Markdown and Mermaid diagram editor
9. **CHAT** - Conversational AI interface

#### Advanced Features
- SQL Bridge connection and transform logging
- Multimodal input processing (images, audio)
- OpenAI-compliant API integration (OpenRouter, Ollama)
- Complexity and style definition controls
- Export functionality (ZIP, JSON, SVG)
- Deep Research agent

#### UI Components
- Navigation (desktop and mobile responsive)
- Modals (Settings, SQL Bridge, Style)
- Interactive elements (buttons, inputs, hover states)
- Visual feedback (orange borders, glow effects)
- Color scheme consistency

### 2.2 Output Level Testing

Each content generation feature will be tested at all complexity levels:

| Level | Description | Expected Characteristics |
|-------|-------------|-------------------------|
| **Simple** | Basic, concise output | Minimal detail, quick generation, essential information only |
| **Standard** | Balanced detail | Moderate depth, typical use case, well-structured |
| **Detailed** | Comprehensive output | In-depth analysis, examples, detailed explanations |
| **Comprehensive** | Maximum depth | Exhaustive coverage, multiple perspectives, extensive documentation |

**Test Requirement**: Generate and save outputs for each level with appropriate suffixes (e.g., `report_simple.md`, `report_detailed.md`)

### 2.3 Logging Requirements

- **JSON Test Log**: All test prompts, inputs, and parameters logged to `Test Inputs/test_log.json`
- **Transform Log**: SQL operations logged and exported per test case
- **Screenshot Manifest**: Index of all UI screenshots with descriptions
- **Execution History**: Timestamp, tester, environment details for each test run

### 2.4 Out of Scope

- Performance benchmarking (covered separately)
- Security penetration testing (covered by CodeQL)
- Cross-browser compatibility beyond Chromium, Firefox, Safari
- Third-party API availability testing (external dependencies)

---

## 3. Test Environment and Infrastructure

### 3.1 Development Environment

- **Node.js**: v18+ 
- **Package Manager**: npm
- **Build Tool**: Vite 6.2.0
- **Test Framework**: Vitest 2.1.8
- **E2E Framework**: Playwright
- **React Version**: 19.2.3
- **TypeScript**: 5.8.2

### 3.2 Test Data Requirements

- Sample text files (TXT, MD)
- Code files (JS, TS, PY)
- Data files (CSV, JSON)
- PowerPoint files (PPTX)
- Images (PNG, JPG, GIF)
- Audio files (MP3, WAV)
- SQL schema samples
- URLs for web content ingestion

### 3.3 API Keys and Configuration

- **Gemini API**: Required for primary testing
- **OpenRouter API**: Optional for multi-provider testing
- **Ollama Local**: Optional for offline testing

---

## 4. Folder Structure

### 4.1 Directory Layout

```
Notebook_Studio/
├── Test Inputs/
│   ├── prompts/
│   │   ├── report_prompts.json
│   │   ├── dashboard_prompts.json
│   │   ├── infographic_prompts.json
│   │   ├── mindmap_prompts.json
│   │   ├── flashcards_prompts.json
│   │   ├── slides_prompts.json
│   │   ├── table_prompts.json
│   │   ├── canvas_prompts.json
│   │   └── chat_prompts.json
│   ├── sample_files/
│   │   ├── text_samples/
│   │   ├── code_samples/
│   │   ├── data_samples/
│   │   ├── image_samples/
│   │   ├── audio_samples/
│   │   └── pptx_samples/
│   ├── sql_schemas/
│   └── test_log.json
├── Test Outputs/
│   ├── reports/
│   │   ├── report_simple.md
│   │   ├── report_standard.md
│   │   ├── report_detailed.md
│   │   └── report_comprehensive.md
│   ├── dashboards/
│   ├── infographics/
│   ├── mindmaps/
│   ├── flashcards/
│   ├── slides/
│   ├── tables/
│   ├── canvas/
│   ├── chat_logs/
│   ├── sql_transforms/
│   │   └── transform_log_{testid}.json
│   └── Screenshots/
│       ├── navigation/
│       ├── modals/
│       ├── views/
│       ├── interactions/
│       └── responsive/
├── Test Reports/
│   ├── test_run_{date}_{testid}.md
│   └── compliance_report.md
└── TEST_PLAN.md (this document)
```

### 4.2 File Naming Conventions

#### Test Inputs
- **Prompts**: `{view_type}_prompts.json`
- **Sample Files**: `{type}_sample_{number}.{ext}`
- **SQL Schemas**: `schema_{scenario}.sql`

#### Test Outputs
- **Content Outputs**: `{view_type}_{level}_{testid}.{ext}`
- **SQL Transforms**: `transform_log_{testid}_{timestamp}.json`
- **Screenshots**: `{category}_{feature}_{testid}.png`

#### Test Reports
- **Test Run Report**: `test_run_{YYYYMMDD}_{testid}.md`
- **Compliance Report**: `compliance_report_{version}.md`

---

## 5. Unique Test Identifiers

### 5.1 Identifier Format

**Pattern**: `{CATEGORY}-{SUBCATEGORY}-{NUMBER}`

**Examples**:
- `FUNC-REPORT-001` - Functional test for Report generation
- `UI-NAV-015` - UI test for Navigation component
- `INT-FILE-003` - Integration test for File upload
- `E2E-FLOW-008` - End-to-end test for complete workflow

### 5.2 Category Codes

| Code | Category | Description |
|------|----------|-------------|
| **FUNC** | Functional | Tests specific feature functionality |
| **UI** | User Interface | Tests UI components and interactions |
| **INT** | Integration | Tests integration between components |
| **E2E** | End-to-End | Tests complete user workflows |
| **PERF** | Performance | Tests performance characteristics |
| **SEC** | Security | Tests security aspects |
| **API** | API | Tests external API integrations |
| **DATA** | Data | Tests data handling and processing |

### 5.3 Subcategory Codes

#### Functional (FUNC)
- **REPORT**: Report generation
- **DASH**: Dashboard generation
- **INFO**: Infographic generation
- **MIND**: Mindmap generation
- **FLASH**: Flashcards generation
- **SLIDE**: Slides generation
- **TABLE**: Table generation
- **CANVAS**: Canvas editing
- **CHAT**: Chat interaction

#### User Interface (UI)
- **NAV**: Navigation
- **MODAL**: Modal dialogs
- **BTN**: Buttons and controls
- **INPUT**: Input fields
- **HOVER**: Hover effects
- **THEME**: Theming and colors
- **RESP**: Responsive design

#### Integration (INT)
- **FILE**: File upload and processing
- **SQL**: SQL Bridge integration
- **LLM**: LLM service integration
- **EXPORT**: Export functionality
- **SETTINGS**: Settings persistence

#### End-to-End (E2E)
- **FLOW**: Complete user workflows
- **MULTI**: Multi-feature interactions

---

## 6. Test Case Documentation Standards

### 6.1 Test Case Template

Each test case must include the following fields:

```markdown
## Test Case: {TEST_ID}

### Test Identifier
{TEST_ID}

### Test Category
{Category} - {Subcategory}

### Test Priority
[ ] Critical | [ ] High | [ ] Medium | [ ] Low

### Test Type
[ ] Automated | [ ] Manual | [ ] Both

### Purpose
{Clear description of what this test validates}

### Preconditions
{Any setup required before test execution}

### Test Steps
1. {Step 1}
2. {Step 2}
3. {Step n}

### Test Data
- Input files: {list}
- Prompts: {reference to prompt file}
- Configuration: {any special settings}

### Expected Outcome
{Detailed description of expected results}

### Actual Outcome
{To be filled during test execution}

### Status
[ ] Not Started | [ ] In Progress | [ ] Passed | [ ] Failed | [ ] Blocked

### Screenshots
- {path/to/screenshot1.png}
- {path/to/screenshot2.png}

### Logs
- Test log: {path/to/test_log.json}
- Transform log: {path/to/transform_log.json}

### Compliance Recommendations
#### Current Implementation
{Assessment of current feature compliance}

#### Required for Feature Compliance
- [ ] {Requirement 1}
- [ ] {Requirement 2}
- [ ] {Requirement n}

### Premium Enhancement Recommendations
#### Current vs Premium Gap
{Analysis of missing premium features}

#### Required for Premium Status
- [ ] {Premium requirement 1}
- [ ] {Premium requirement 2}
- [ ] {Premium requirement n}

### Notes
{Any additional observations or issues}

### Test Date
{Date executed}

### Tester
{Name/ID of tester}
```

### 6.2 Documentation Requirements

For **every** test case:

1. ✅ **Unique Identifier** - Following the format specified in Section 5
2. ✅ **Purpose Statement** - Clear, concise explanation
3. ✅ **Expected vs Actual Outcomes** - Documented comparison
4. ✅ **Screenshots** - For all UI-related tests
5. ✅ **Test Inputs** - Saved in appropriate folder
6. ✅ **Test Outputs** - Saved with correct naming convention
7. ✅ **Compliance Assessment** - Baseline feature requirements
8. ✅ **Premium Gap Analysis** - What's needed for premium status
9. ✅ **Traceability** - Links to requirements, code, and related tests

---

## 7. Test Categories

### 7.1 Functional Tests

Tests that verify specific feature functionality works as designed.

**Focus Areas**:
- Content generation accuracy
- Source management operations
- View switching and navigation
- Settings application
- Export functionality

**Example Test Cases**:
- `FUNC-REPORT-001`: Generate simple report from text sources
- `FUNC-REPORT-002`: Generate comprehensive report with multimodal inputs
- `FUNC-DASH-001`: Create dashboard from CSV data
- `FUNC-TABLE-001`: Generate table from SQL schema context

### 7.2 User Interface Tests

Tests that verify UI components render correctly and respond to interactions.

**Focus Areas**:
- Visual consistency (colors, borders, spacing)
- Interactive elements (hover, focus, click)
- Responsive design (mobile, tablet, desktop)
- Modal dialogs
- Navigation menus

**Example Test Cases**:
- `UI-NAV-001`: Verify all navigation buttons are accessible
- `UI-HOVER-001`: Verify orange border appears on button hover
- `UI-MODAL-001`: Open and close Settings modal
- `UI-RESP-001`: Test mobile navigation dropdown

### 7.3 Integration Tests

Tests that verify multiple components work together correctly.

**Focus Areas**:
- File upload to source creation
- Source to content generation
- SQL Bridge to table generation
- Settings to output customization
- Multi-provider LLM switching

**Example Test Cases**:
- `INT-FILE-001`: Upload CSV → Create source → Generate table
- `INT-SQL-001`: Connect SQL Bridge → Query → Log transform
- `INT-LLM-001`: Switch provider → Generate content
- `INT-EXPORT-001`: Generate content → Export as ZIP

### 7.4 End-to-End Tests

Tests that simulate complete user workflows from start to finish.

**Focus Areas**:
- New user onboarding flow
- Complete notebook creation workflow
- Multi-page document generation
- SQL analysis workflow
- Canvas diagram creation and export

**Example Test Cases**:
- `E2E-FLOW-001`: Create notebook → Add sources → Generate all views → Export
- `E2E-FLOW-002`: SQL Bridge setup → Query data → Generate table → Export log
- `E2E-FLOW-003`: Upload image → Generate infographic → Export SVG
- `E2E-FLOW-004`: Create Mermaid diagram → Export SVG → Verify rendering

### 7.5 API Integration Tests

Tests that verify external API integrations work correctly.

**Focus Areas**:
- Gemini API connectivity
- OpenRouter API support
- Ollama local integration
- Error handling for API failures

**Example Test Cases**:
- `API-GEMINI-001`: Generate content with Gemini API
- `API-OPENROUTER-001`: Switch to OpenRouter and generate content
- `API-OLLAMA-001`: Configure local Ollama and test generation
- `API-ERROR-001`: Handle API key error gracefully

### 7.6 Data Processing Tests

Tests that verify data handling and transformation logic.

**Focus Areas**:
- File parsing accuracy
- Text extraction from various formats
- SQL transform logging
- Data export integrity

**Example Test Cases**:
- `DATA-PARSE-001`: Extract text from PDF
- `DATA-PARSE-002`: Extract text from PPTX
- `DATA-CSV-001`: Parse and process CSV file
- `DATA-JSON-001`: Parse and structure JSON data

---

## 8. Automated vs Manual Tests

### 8.1 Automated Tests

**Framework**: Vitest for unit/integration, Playwright for E2E

**Should be Automated**:
- ✅ Unit tests for services (LLM, SQL, Tool, Parser)
- ✅ Component render tests
- ✅ API integration tests (mocked)
- ✅ Data parsing tests
- ✅ State management tests
- ✅ File processing logic tests
- ✅ Navigation flow tests (E2E)
- ✅ Form validation tests
- ✅ Export functionality tests

**Automation Categories**:

| Category | Test Count | Framework | Status |
|----------|------------|-----------|--------|
| Unit Tests | 50+ | Vitest | ✅ Partial (5 existing) |
| Integration Tests | 30+ | Vitest | ❌ To be implemented |
| E2E Tests | 20+ | Playwright | ✅ Partial (1 existing) |

**Automated Test Examples**:
```typescript
// FUNC-REPORT-001-AUTO
describe('Report Generation', () => {
  it('should generate simple report from text sources', async () => {
    const sources = [createMockSource('text', 'Sample content')];
    const result = await generateContent('report', sources, { complexity: 'Simple' });
    expect(result).toContain('Sample content');
    expect(result.length).toBeGreaterThan(100);
  });
});

// INT-FILE-001-AUTO
describe('File Upload Integration', () => {
  it('should process CSV file and create source', async () => {
    const file = new File(['col1,col2\n1,2'], 'test.csv', { type: 'text/csv' });
    const source = await handleFileUpload(file);
    expect(source.type).toBe('data');
    expect(source.content).toContain('col1,col2');
  });
});
```

### 8.2 Manual Tests

**Should be Manual**:
- ✅ Visual inspection (UI consistency, colors, spacing)
- ✅ Complex user workflows spanning multiple features
- ✅ Screenshot capture for documentation
- ✅ LLM output quality assessment
- ✅ Premium feature gap analysis
- ✅ Cross-browser visual consistency
- ✅ Accessibility testing (screen readers, keyboard navigation)
- ✅ Mobile responsive behavior verification

**Manual Test Examples**:

#### UI-THEME-001-MANUAL: Visual Consistency Check
**Steps**:
1. Start application
2. Inspect main background color (should be `neutral-700`)
3. Hover over navigation buttons
4. Verify orange border appears (`border-orange-500`)
5. Verify glow effect: `shadow-[0_0_10px_rgba(249,115,22,0.5)]`
6. Take screenshots of each state
7. Compare against design specifications

#### FUNC-REPORT-002-MANUAL: Content Quality Assessment
**Steps**:
1. Upload diverse sources (text, image, data)
2. Generate comprehensive report
3. Evaluate:
   - Coherence and structure
   - Integration of multimodal inputs
   - Depth appropriate to "Comprehensive" level
   - Professional formatting
4. Document any quality issues
5. Save output to `Test Outputs/reports/report_comprehensive_FUNC-REPORT-002.md`

### 8.3 Hybrid Tests (Both Automated and Manual)

Some tests benefit from both automated validation and manual inspection:

**Examples**:
- `E2E-FLOW-001`: Automated navigation + Manual output quality check
- `INT-SQL-001`: Automated transform log validation + Manual SQL query review
- `UI-RESP-001`: Automated layout tests + Manual visual inspection

---

## 9. Test Case Inventory

### 9.1 Functional Test Cases

#### Report Generation (FUNC-REPORT)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-REPORT-001 | Generate simple report from text source | Auto | High | ✅ |
| FUNC-REPORT-002 | Generate standard report with mixed sources | Auto | High | 📝 |
| FUNC-REPORT-003 | Generate detailed report with style settings | Manual | Medium | 📝 |
| FUNC-REPORT-004 | Generate comprehensive report with SQL context | Manual | High | 📝 |
| FUNC-REPORT-005 | Test report generation with multimodal inputs | Both | High | 📝 |

#### Dashboard Generation (FUNC-DASH)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-DASH-001 | Generate dashboard from CSV data | Both | High | 📝 |
| FUNC-DASH-002 | Generate dashboard with chart visualizations | Manual | High | 📝 |
| FUNC-DASH-003 | Test dashboard with SQL data source | Both | Medium | 📝 |
| FUNC-DASH-004 | Generate dashboard at all complexity levels | Manual | Medium | 📝 |

#### Infographic Generation (FUNC-INFO)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-INFO-001 | Generate infographic from text sources | Manual | High | 📝 |
| FUNC-INFO-002 | Generate infographic with image analysis | Manual | High | 📝 |
| FUNC-INFO-003 | Test infographic visual layout recommendations | Manual | Medium | 📝 |

#### Mindmap Generation (FUNC-MIND)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-MIND-001 | Generate tree view mindmap | Auto | High | 📝 |
| FUNC-MIND-002 | Generate Mermaid mindmap | Auto | High | 📝 |
| FUNC-MIND-003 | Toggle between tree and Mermaid views | Manual | Medium | 📝 |
| FUNC-MIND-004 | Export mindmap as SVG | Both | Medium | 📝 |

#### Flashcards Generation (FUNC-FLASH)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-FLASH-001 | Generate flashcards from text sources | Auto | Medium | 📝 |
| FUNC-FLASH-002 | Test flashcard quantity controls | Manual | Low | 📝 |
| FUNC-FLASH-003 | Verify question/answer structure | Auto | Medium | 📝 |

#### Slides Generation (FUNC-SLIDE)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-SLIDE-001 | Generate slides from text sources | Auto | High | 📝 |
| FUNC-SLIDE-002 | Generate slides with multimodal inputs | Manual | High | 📝 |
| FUNC-SLIDE-003 | Test slide count and structure | Auto | Medium | 📝 |

#### Table Generation (FUNC-TABLE)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-TABLE-001 | Generate table from CSV data | Auto | High | 📝 |
| FUNC-TABLE-002 | Generate table from SQL schema | Both | High | 📝 |
| FUNC-TABLE-003 | Test JOIN operations in table generation | Manual | Medium | 📝 |
| FUNC-TABLE-004 | Verify calculation documentation | Auto | Medium | 📝 |

#### Canvas Features (FUNC-CANVAS)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-CANVAS-001 | Edit and preview Markdown | Manual | High | 📝 |
| FUNC-CANVAS-002 | Create and render Mermaid diagram | Manual | High | 📝 |
| FUNC-CANVAS-003 | Toggle between Markdown and Mermaid modes | Manual | High | 📝 |
| FUNC-CANVAS-004 | Export Mermaid diagram as SVG | Manual | Medium | 📝 |
| FUNC-CANVAS-005 | Load example Markdown/Mermaid | Manual | Low | 📝 |

#### Chat Interface (FUNC-CHAT)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| FUNC-CHAT-001 | Send message and receive response | Auto | Critical | 📝 |
| FUNC-CHAT-002 | Test multimodal chat with images | Manual | High | 📝 |
| FUNC-CHAT-003 | Query SQL context in chat | Manual | High | 📝 |
| FUNC-CHAT-004 | Test chat history persistence | Auto | Medium | 📝 |

### 9.2 User Interface Test Cases

#### Navigation (UI-NAV)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| UI-NAV-001 | Verify all navigation buttons accessible | Auto | Critical | 📝 |
| UI-NAV-002 | Test active view highlighting | Manual | High | 📝 |
| UI-NAV-003 | Test mobile navigation dropdown | Manual | High | 📝 |
| UI-NAV-004 | Verify smooth view transitions | Manual | Medium | 📝 |
| UI-NAV-005 | Test keyboard navigation | Manual | Medium | 📝 |

#### Hover Effects (UI-HOVER)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| UI-HOVER-001 | Verify orange border on button hover | Manual | High | 📝 |
| UI-HOVER-002 | Verify glow effect on focused elements | Manual | High | 📝 |
| UI-HOVER-003 | Test hover states on all interactive elements | Manual | Medium | 📝 |

#### Modals (UI-MODAL)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| UI-MODAL-001 | Open and close Settings modal | Both | High | 📝 |
| UI-MODAL-002 | Open and close SQL Bridge modal | Both | High | 📝 |
| UI-MODAL-003 | Open and close Style Definition modal | Both | High | 📝 |
| UI-MODAL-004 | Test modal overlay and backdrop | Manual | Medium | 📝 |
| UI-MODAL-005 | Verify modal escape key handling | Auto | Medium | 📝 |

#### Theme and Colors (UI-THEME)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| UI-THEME-001 | Verify background colors (neutral-700) | Manual | High | 📝 |
| UI-THEME-002 | Verify orange accent colors | Manual | High | 📝 |
| UI-THEME-003 | Test text contrast and readability | Manual | Medium | 📝 |
| UI-THEME-004 | Verify dark mode consistency | Manual | Medium | 📝 |

#### Responsive Design (UI-RESP)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| UI-RESP-001 | Test mobile layout (<768px) | Manual | High | 📝 |
| UI-RESP-002 | Test tablet layout (768-1024px) | Manual | Medium | 📝 |
| UI-RESP-003 | Test desktop layout (>1024px) | Manual | Medium | 📝 |
| UI-RESP-004 | Verify responsive navigation | Manual | High | 📝 |

### 9.3 Integration Test Cases

#### File Upload Integration (INT-FILE)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| INT-FILE-001 | Upload text file → Create source | Auto | Critical | 📝 |
| INT-FILE-002 | Upload CSV → Create source → Generate table | Auto | Critical | 📝 |
| INT-FILE-003 | Upload image → Process as multimodal | Auto | Critical | 📝 |
| INT-FILE-004 | Upload PPTX → Extract text | Auto | High | 📝 |
| INT-FILE-005 | Upload multiple files sequentially | Auto | High | 📝 |

#### SQL Bridge Integration (INT-SQL)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| INT-SQL-001 | Connect SQL Bridge → Store schema | Auto | High | 📝 |
| INT-SQL-002 | SQL context → Chat query → Log transform | Both | High | 📝 |
| INT-SQL-003 | SQL context → Generate table → Log transform | Both | High | 📝 |
| INT-SQL-004 | Export transform log as JSON | Auto | Medium | 📝 |
| INT-SQL-005 | Verify transform log structure | Auto | Medium | 📝 |

#### LLM Service Integration (INT-LLM)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| INT-LLM-001 | Test Gemini API integration | Auto | Critical | ✅ |
| INT-LLM-002 | Switch to OpenRouter → Generate content | Manual | High | 📝 |
| INT-LLM-003 | Test Ollama local integration | Manual | Medium | 📝 |
| INT-LLM-004 | Test error handling for API failures | Auto | High | ✅ |
| INT-LLM-005 | Test multimodal input processing | Auto | High | ✅ |

#### Settings Integration (INT-SETTINGS)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| INT-SETTINGS-001 | Apply complexity setting → Generate content | Both | High | 📝 |
| INT-SETTINGS-002 | Apply style definition → Verify in output | Manual | High | 📝 |
| INT-SETTINGS-003 | Change LLM provider → Test generation | Manual | High | 📝 |
| INT-SETTINGS-004 | Verify settings persistence | Auto | Medium | 📝 |

#### Export Integration (INT-EXPORT)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| INT-EXPORT-001 | Export notebook as ZIP | Auto | High | 📝 |
| INT-EXPORT-002 | Export Mermaid diagram as SVG | Auto | Medium | 📝 |
| INT-EXPORT-003 | Export SQL transform log as JSON | Auto | Medium | 📝 |
| INT-EXPORT-004 | Verify exported file integrity | Auto | High | 📝 |

### 9.4 End-to-End Test Cases

#### Complete Workflows (E2E-FLOW)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| E2E-FLOW-001 | Create notebook → Add sources → Generate all views → Export | Both | Critical | 📝 |
| E2E-FLOW-002 | SQL Bridge setup → Query → Generate table → Export log | Manual | High | 📝 |
| E2E-FLOW-003 | Upload image → Generate infographic → Review output | Manual | High | 📝 |
| E2E-FLOW-004 | Canvas Mermaid diagram → Export SVG → Verify rendering | Manual | Medium | 📝 |
| E2E-FLOW-005 | Multi-page notebook → Generate reports → Navigate pages | Manual | Medium | 📝 |

#### Multi-Feature Workflows (E2E-MULTI)

| Test ID | Description | Type | Priority | Status |
|---------|-------------|------|----------|--------|
| E2E-MULTI-001 | Combine text, image, CSV → Generate dashboard | Manual | High | 📝 |
| E2E-MULTI-002 | SQL + CSV → Complex table with JOINs | Manual | High | 📝 |
| E2E-MULTI-003 | Settings customization → Multiple view generations | Manual | Medium | 📝 |

---

## 10. Test Execution Process

### 10.1 Pre-Execution Setup

#### Environment Preparation
1. **Clean Environment**
   ```bash
   git clone https://github.com/HaggisSupper/Notebook_Studio
   cd Notebook_Studio
   npm install
   ```

2. **Create Test Folders**
   ```bash
   mkdir -p "Test Inputs/prompts"
   mkdir -p "Test Inputs/sample_files"/{text_samples,code_samples,data_samples,image_samples,audio_samples,pptx_samples}
   mkdir -p "Test Inputs/sql_schemas"
   mkdir -p "Test Outputs"/{reports,dashboards,infographics,mindmaps,flashcards,slides,tables,canvas,chat_logs,sql_transforms}
   mkdir -p "Test Outputs/Screenshots"/{navigation,modals,views,interactions,responsive}
   mkdir -p "Test Reports"
   ```

3. **Configure API Keys**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add GEMINI_API_KEY
   ```

4. **Prepare Test Data**
   - Copy sample files to `Test Inputs/sample_files/`
   - Create test prompts in JSON format
   - Prepare SQL schemas

#### Test Log Initialization
Create `Test Inputs/test_log.json`:
```json
{
  "testSuite": "Notebook Studio Comprehensive Test Plan v1.0",
  "executionDate": "2024-12-26T00:00:00Z",
  "environment": {
    "nodeVersion": "18.x",
    "npmVersion": "9.x",
    "os": "Linux/Windows/macOS"
  },
  "testRuns": []
}
```

### 10.2 Test Execution Workflow

#### For Automated Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run specific test file
npm run test -- src/services/llmService.test.ts
```

#### For Manual Tests
1. **Start Application**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Navigate to http://localhost:3000
   - Open DevTools (F12) for console inspection

3. **Execute Test Steps**
   - Follow test case steps precisely
   - Document each action taken
   - Capture screenshots at key points

4. **Record Inputs**
   - Save all prompts to `Test Inputs/prompts/`
   - Log test parameters to `test_log.json`

5. **Save Outputs**
   - Save generated content with proper naming convention
   - Capture and save screenshots
   - Export any logs (SQL transforms, etc.)

6. **Document Results**
   - Update test case with actual outcomes
   - Mark status (Passed/Failed/Blocked)
   - Add notes about any issues

### 10.3 Output Level Testing Procedure

For each content generation feature, test all complexity levels:

**Example: Report Generation**

1. **Setup**
   - Create test sources (text, image, data)
   - Configure API connection

2. **Simple Level**
   ```
   - Open Style modal
   - Select "Simple" complexity
   - Click "Execute Single View"
   - Save output: Test Outputs/reports/report_simple_FUNC-REPORT-001.md
   - Take screenshot: Test Outputs/Screenshots/views/report_simple_FUNC-REPORT-001.png
   ```

3. **Standard Level**
   ```
   - Select "Standard" complexity
   - Click "Execute Single View"
   - Save output: Test Outputs/reports/report_standard_FUNC-REPORT-001.md
   - Take screenshot: Test Outputs/Screenshots/views/report_standard_FUNC-REPORT-001.png
   ```

4. **Detailed Level**
   ```
   - Select "Detailed" complexity
   - Click "Execute Single View"
   - Save output: Test Outputs/reports/report_detailed_FUNC-REPORT-001.md
   - Take screenshot: Test Outputs/Screenshots/views/report_detailed_FUNC-REPORT-001.png
   ```

5. **Comprehensive Level**
   ```
   - Select "Comprehensive" complexity
   - Click "Execute Single View"
   - Save output: Test Outputs/reports/report_comprehensive_FUNC-REPORT-001.md
   - Take screenshot: Test Outputs/Screenshots/views/report_comprehensive_FUNC-REPORT-001.png
   ```

6. **Analysis**
   - Compare outputs for appropriate depth progression
   - Verify each level meets expectations
   - Document any issues

### 10.4 Screenshot Capture Guidelines

**Required Screenshots**:
- Initial state of UI
- Each interaction step
- Final state/result
- Any error messages
- Different responsive breakpoints

**Screenshot Naming**:
`{category}_{feature}_{action}_{testid}.png`

Examples:
- `navigation_main_menu_active_UI-NAV-002.png`
- `modal_settings_open_UI-MODAL-001.png`
- `view_report_comprehensive_FUNC-REPORT-004.png`

**Tools**:
- Browser built-in screenshot (F12 → Screenshot)
- OS screenshot tools (Snipping Tool, macOS Screenshot)
- Automated via Playwright: `await page.screenshot()`

### 10.5 Test Log Updates

After each test execution, update `test_log.json`:

```json
{
  "testRuns": [
    {
      "testId": "FUNC-REPORT-001",
      "timestamp": "2024-12-26T10:30:00Z",
      "tester": "John Doe",
      "status": "Passed",
      "duration": "120s",
      "inputs": {
        "prompts": ["Generate a report about AI trends"],
        "sources": ["test_text_1.txt", "test_image_1.png"],
        "settings": {
          "complexity": "Simple",
          "style": "Professional"
        }
      },
      "outputs": {
        "file": "Test Outputs/reports/report_simple_FUNC-REPORT-001.md",
        "screenshots": [
          "Test Outputs/Screenshots/views/report_simple_FUNC-REPORT-001.png"
        ]
      },
      "notes": "Generation successful, output quality excellent"
    }
  ]
}
```

---

## 11. Test Report Template

### 11.1 Test Run Report Structure

Each test run should produce a comprehensive report:

```markdown
# Test Run Report: {TEST_RUN_ID}

**Test Run ID**: {YYYYMMDD}-{SEQUENCE}  
**Date**: {Date}  
**Tester**: {Name}  
**Environment**: {OS, Browser, Node version}  
**Duration**: {Total time}

---

## 1. Purpose of Test Run

{Description of what this test run aims to validate}

## 2. Test Scope

### Features Tested
- {Feature 1}
- {Feature 2}
- {Feature n}

### Test Cases Executed
- {TEST_ID_1}: {Description}
- {TEST_ID_2}: {Description}
- {TEST_ID_n}: {Description}

## 3. Test Environment

- **Node.js**: {version}
- **npm**: {version}
- **Browser**: {name and version}
- **OS**: {operating system}
- **API Provider**: {Gemini/OpenRouter/Ollama}

## 4. Test Execution Summary

| Test ID | Description | Status | Duration | Notes |
|---------|-------------|--------|----------|-------|
| {ID} | {Desc} | ✅ Pass / ❌ Fail / ⚠️ Blocked | {time} | {notes} |

### Statistics
- **Total Tests**: {number}
- **Passed**: {number} ({percentage}%)
- **Failed**: {number} ({percentage}%)
- **Blocked**: {number} ({percentage}%)
- **Success Rate**: {percentage}%

## 5. Test Case Details

### Test Case: {TEST_ID_1}

**Status**: ✅ Passed / ❌ Failed / ⚠️ Blocked

**Expected Outcome**:
{Description}

**Actual Outcome**:
{Description}

**Screenshots**:
- {path/to/screenshot1.png}
- {path/to/screenshot2.png}

**Test Outputs**:
- {path/to/output_file}

**Logs**:
- Test Log: {path/to/test_log.json}
- Transform Log: {path/to/transform_log.json}

**Issues Found**:
- {Issue 1}
- {Issue 2}

---

{Repeat for each test case}

## 6. Defects and Issues

| Issue ID | Severity | Description | Test ID | Status |
|----------|----------|-------------|---------|--------|
| {ID} | Critical/High/Medium/Low | {Description} | {TEST_ID} | Open/In Progress/Resolved |

## 7. Output Level Validation

For each feature tested at multiple complexity levels:

### {Feature Name} Output Levels

| Level | Status | Output Quality | File Size | Notes |
|-------|--------|----------------|-----------|-------|
| Simple | ✅ | Adequate | {size} | {notes} |
| Standard | ✅ | Good | {size} | {notes} |
| Detailed | ✅ | Excellent | {size} | {notes} |
| Comprehensive | ✅ | Excellent | {size} | {notes} |

**Analysis**: {Commentary on progression and quality across levels}

## 8. Compliance Evaluation

### Feature Compliance Status

| Feature | Current Status | Compliance Gap | Priority |
|---------|----------------|----------------|----------|
| {Feature 1} | Compliant / Partial / Non-compliant | {Description} | High/Medium/Low |
| {Feature 2} | Compliant / Partial / Non-compliant | {Description} | High/Medium/Low |

### Requirements for Full Feature Compliance

#### {Feature 1}
- [ ] {Requirement 1}
- [ ] {Requirement 2}
- [ ] {Requirement n}

#### {Feature 2}
- [ ] {Requirement 1}
- [ ] {Requirement 2}

## 9. Premium Feature Gap Analysis

### Current vs Premium Comparison

| Feature Area | Current Implementation | Premium Requirements | Gap Assessment |
|--------------|------------------------|----------------------|----------------|
| {Area 1} | {Description} | {Requirements} | {Gap analysis} |
| {Area 2} | {Description} | {Requirements} | {Gap analysis} |

### Recommendations for Premium Status

#### Priority 1 (Critical for Premium)
- [ ] {Recommendation 1}
- [ ] {Recommendation 2}

#### Priority 2 (Important for Premium)
- [ ] {Recommendation 1}
- [ ] {Recommendation 2}

#### Priority 3 (Nice-to-Have for Premium)
- [ ] {Recommendation 1}
- [ ] {Recommendation 2}

## 10. Performance Observations

- **Average Content Generation Time**: {time}
- **UI Responsiveness**: Excellent / Good / Needs Improvement
- **Memory Usage**: {description}
- **Build Time**: {time}

## 11. Browser Compatibility

| Browser | Version | Status | Issues |
|---------|---------|--------|--------|
| Chrome | {version} | ✅ | None |
| Firefox | {version} | ✅ | None |
| Safari | {version} | ✅ | {issues if any} |

## 12. Accessibility Notes

- Keyboard navigation: {assessment}
- Screen reader compatibility: {assessment}
- Color contrast: {assessment}
- Focus indicators: {assessment}

## 13. Recommendations

### Immediate Actions Required
1. {Action 1}
2. {Action 2}

### Short-term Improvements (1-2 weeks)
1. {Improvement 1}
2. {Improvement 2}

### Long-term Enhancements (1+ months)
1. {Enhancement 1}
2. {Enhancement 2}

## 14. Conclusion

{Overall assessment of test run results, compliance status, and readiness for production/release}

### Overall Quality Score: {score}/10

**Rationale**: {Explanation of score}

---

**Report Generated By**: {Tester Name}  
**Report Date**: {Date}  
**Next Review Date**: {Date}
```

### 11.2 Compliance Report Template

Create `Test Reports/compliance_report.md`:

```markdown
# Feature Compliance Report

**Application**: Notebook Studio  
**Version**: {version}  
**Report Date**: {date}  
**Evaluator**: {name}

---

## Executive Summary

{High-level assessment of application's compliance status and readiness}

## Compliance Scoring

**Overall Compliance Score**: {score}/100

### Scoring Breakdown

| Category | Weight | Score | Weighted Score |
|----------|--------|-------|----------------|
| Core Functionality | 30% | {score}/100 | {weighted} |
| UI/UX Quality | 20% | {score}/100 | {weighted} |
| Data Handling | 15% | {score}/100 | {weighted} |
| Integration | 15% | {score}/100 | {weighted} |
| Performance | 10% | {score}/100 | {weighted} |
| Documentation | 10% | {score}/100 | {weighted} |

## Feature-by-Feature Compliance

### {Feature 1}

**Compliance Status**: ✅ Compliant / ⚠️ Partial / ❌ Non-compliant

**Current Implementation**:
{Description of what exists}

**Requirements for Compliance**:
- [ ] {Requirement 1}
- [ ] {Requirement 2}

**Gap Analysis**:
{What's missing or needs improvement}

---

{Repeat for each feature}

## Premium Feature Gap

### Missing Premium Features

1. **{Premium Feature 1}**
   - Current: {status}
   - Premium Requirement: {description}
   - Implementation Effort: {Low/Medium/High}
   - Business Value: {Low/Medium/High}

2. **{Premium Feature 2}**
   - Current: {status}
   - Premium Requirement: {description}
   - Implementation Effort: {Low/Medium/High}
   - Business Value: {Low/Medium/High}

### Premium Enhancement Roadmap

#### Phase 1: Essential Premium Features
- [ ] {Feature 1}
- [ ] {Feature 2}

#### Phase 2: Advanced Premium Features
- [ ] {Feature 1}
- [ ] {Feature 2}

#### Phase 3: Enterprise Features
- [ ] {Feature 1}
- [ ] {Feature 2}

## Recommendations

### For Feature Compliance
{Actionable recommendations to achieve baseline compliance}

### For Premium Status
{Actionable recommendations to elevate to premium/enterprise tier}

---

**Approved By**: {Name}  
**Approval Date**: {Date}
```

---

## 12. Compliance and Premium Requirements

### 12.1 Feature Compliance Criteria

**Baseline Compliance** means the feature:
- ✅ Works as documented
- ✅ Handles errors gracefully
- ✅ Provides adequate user feedback
- ✅ Meets basic usability standards
- ✅ Is accessible via documented UI
- ✅ Produces expected outputs
- ✅ Has adequate performance

### 12.2 Premium Feature Criteria

**Premium Status** means the feature additionally:
- ✅ Has advanced customization options
- ✅ Includes professional templates/presets
- ✅ Supports batch/bulk operations
- ✅ Provides detailed analytics/metrics
- ✅ Has collaborative features (sharing, commenting)
- ✅ Includes export to multiple formats
- ✅ Has offline/local capabilities
- ✅ Provides API/webhook integrations
- ✅ Has enterprise-grade security
- ✅ Includes priority support/documentation

### 12.3 Compliance Assessment by Feature

#### Report Generation

**Current Compliance**: ⚠️ Partial

**Baseline Requirements** (For Compliance):
- [ ] Support all common document structures (executive summary, TOC, sections, conclusions)
- [ ] Include proper citation of sources
- [ ] Support export to PDF (currently only text/markdown)
- [ ] Template library for different report types
- [ ] Consistent formatting across complexity levels

**Premium Requirements**:
- [ ] Collaborative editing and commenting
- [ ] Version control and change tracking
- [ ] Custom branding (logo, colors, fonts)
- [ ] Multi-language support
- [ ] Automated report scheduling
- [ ] Integration with document management systems
- [ ] Advanced analytics (reading time, comprehension metrics)
- [ ] Professional report templates (McKinsey, BCG style)

#### Dashboard Generation

**Current Compliance**: ⚠️ Partial

**Baseline Requirements**:
- [ ] Interactive charts (currently static text descriptions)
- [ ] Real-time data refresh capability
- [ ] Export as image/PDF
- [ ] Multiple chart type support (bar, line, pie, scatter)
- [ ] Color customization

**Premium Requirements**:
- [ ] Live data connections (APIs, databases)
- [ ] Dashboard templates library
- [ ] Drill-down capabilities
- [ ] Custom KPI definitions
- [ ] Scheduled dashboard generation
- [ ] Embedding in external applications
- [ ] Advanced filters and parameters
- [ ] Mobile-optimized dashboard views

#### SQL Bridge

**Current Compliance**: ⚠️ Partial

**Baseline Requirements**:
- [ ] Actual SQL query execution (currently simulated)
- [ ] Support for multiple database types (PostgreSQL, MySQL, SQL Server)
- [ ] Query builder UI
- [ ] Result set visualization
- [ ] Query history

**Premium Requirements**:
- [ ] Real-time database connections
- [ ] Query optimization suggestions
- [ ] Scheduled query execution
- [ ] Data warehouse integrations
- [ ] Query performance analytics
- [ ] Role-based access control
- [ ] Audit logging for compliance
- [ ] Data masking for sensitive fields

#### File Upload System

**Current Compliance**: ⚠️ Partial

**Baseline Requirements**:
- [ ] Multiple file upload support (currently single file)
- [ ] PDF text extraction (not yet implemented)
- [ ] Progress indicators for large files
- [ ] File validation and error handling
- [ ] Drag-and-drop support

**Premium Requirements**:
- [ ] OCR for scanned documents
- [ ] Batch processing of files
- [ ] Cloud storage integrations (Google Drive, Dropbox, OneDrive)
- [ ] File format conversion
- [ ] Automatic file categorization
- [ ] Content analysis and tagging
- [ ] File versioning
- [ ] Advanced search within uploaded files

---

## 13. Success Criteria

### 13.1 Test Plan Success Criteria

The test plan implementation is successful when:

1. ✅ **Comprehensive Coverage**
   - All 9 view types tested
   - All 4 complexity levels validated
   - All major features have test cases

2. ✅ **Adequate Automation**
   - 80%+ code coverage from unit tests
   - Critical paths covered by E2E tests
   - CI/CD integration for automated tests

3. ✅ **Complete Documentation**
   - All test cases documented with unique IDs
   - Screenshots captured for all UI tests
   - Test logs maintained in JSON format
   - Test reports generated for each run

4. ✅ **Quality Outputs**
   - Test outputs saved for all complexity levels
   - Screenshots organized by category
   - SQL transform logs exported and validated

5. ✅ **Actionable Insights**
   - Compliance gaps identified and prioritized
   - Premium feature roadmap defined
   - Clear recommendations for improvements

### 13.2 Application Quality Criteria

The application meets quality standards when:

1. ✅ **Functional Completeness**
   - All documented features work as described
   - No critical bugs in core workflows
   - Error handling prevents crashes

2. ✅ **User Experience**
   - Intuitive navigation
   - Responsive design works across devices
   - Visual consistency maintained
   - Adequate loading indicators

3. ✅ **Performance**
   - Content generation < 30s for standard complexity
   - UI interactions < 100ms response time
   - Smooth scrolling and navigation

4. ✅ **Reliability**
   - 95%+ uptime for core features
   - Graceful degradation when APIs fail
   - Data persistence works correctly

5. ✅ **Compliance**
   - Meets baseline feature requirements
   - Accessibility standards followed (WCAG 2.1 Level AA)
   - Security best practices implemented

---

## 14. Appendices

### Appendix A: Test Data Samples

#### A.1 Sample Prompts

**Report Generation Prompts** (`Test Inputs/prompts/report_prompts.json`):
```json
{
  "simple": [
    "Generate a brief report summarizing the key points",
    "Create a short overview of the main findings"
  ],
  "standard": [
    "Generate a comprehensive report analyzing the data and providing insights",
    "Create a detailed analysis with supporting evidence"
  ],
  "detailed": [
    "Generate an in-depth report with extensive analysis, examples, and recommendations",
    "Create a thorough examination including methodology, findings, and implications"
  ],
  "comprehensive": [
    "Generate an exhaustive report covering all aspects with detailed analysis, multiple perspectives, and actionable recommendations",
    "Create a complete analytical document with background, methodology, findings, discussion, and future directions"
  ]
}
```

#### A.2 Sample File Templates

**CSV Data Sample** (`Test Inputs/sample_files/data_samples/sales_data.csv`):
```csv
Date,Product,Category,Sales,Revenue,Region
2024-01-15,Widget A,Electronics,45,1350,North
2024-01-15,Widget B,Electronics,32,960,South
2024-01-16,Gadget X,Home,28,700,East
2024-01-16,Tool Y,Industrial,15,450,West
```

**SQL Schema Sample** (`Test Inputs/sql_schemas/ecommerce_schema.sql`):
```sql
CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY,
  Name VARCHAR(100),
  Email VARCHAR(100),
  Country VARCHAR(50)
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY,
  CustomerID INT,
  OrderDate DATE,
  TotalAmount DECIMAL(10,2),
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

CREATE TABLE OrderItems (
  OrderItemID INT PRIMARY KEY,
  OrderID INT,
  ProductName VARCHAR(100),
  Quantity INT,
  UnitPrice DECIMAL(10,2),
  FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);
```

### Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New notebook |
| `Ctrl/Cmd + S` | Save current state |
| `Ctrl/Cmd + Z` | Undo source change |
| `Ctrl/Cmd + Shift + Z` | Redo source change |
| `Ctrl/Cmd + E` | Export notebook |
| `Esc` | Close modal |
| `Tab` | Navigate between elements |
| `Enter` | Submit/Execute |

### Appendix C: Browser Compatibility Matrix

| Feature | Chrome 120+ | Firefox 120+ | Safari 17+ | Edge 120+ |
|---------|-------------|--------------|------------|-----------|
| Core UI | ✅ | ✅ | ✅ | ✅ |
| File Upload | ✅ | ✅ | ✅ | ✅ |
| Mermaid Diagrams | ✅ | ✅ | ⚠️ | ✅ |
| Canvas Editing | ✅ | ✅ | ✅ | ✅ |
| Export ZIP | ✅ | ✅ | ✅ | ✅ |
| Local Storage | ✅ | ✅ | ✅ | ✅ |

Legend:
- ✅ Full support
- ⚠️ Partial support or minor issues
- ❌ Not supported

### Appendix D: Error Code Reference

| Error Code | Description | Resolution |
|------------|-------------|------------|
| API_KEY_MISSING | Gemini API key not configured | Set GEMINI_API_KEY in .env.local |
| API_ERROR_401 | Invalid API key | Verify API key is correct |
| API_ERROR_429 | Rate limit exceeded | Wait and retry, or upgrade API tier |
| FILE_TOO_LARGE | Uploaded file exceeds size limit | Compress or split file |
| UNSUPPORTED_FORMAT | File format not supported | Convert to supported format |
| NETWORK_ERROR | Network connection failed | Check internet connection |
| GENERATION_FAILED | Content generation failed | Check API status, retry |
| EXPORT_FAILED | Export operation failed | Check browser permissions |

### Appendix E: Glossary

**Complexity Level**: The depth and detail of generated content (Simple, Standard, Detailed, Comprehensive)

**Multimodal**: Content that includes multiple types of media (text, images, audio)

**SQL Bridge**: Simulated database connection feature that allows AI to query schema context

**Transform Log**: Record of SQL operations, JOINs, and calculations performed

**VLM**: Vision-Language Model, AI model capable of processing both images and text

**Canvas**: Freeform editor for Markdown and Mermaid diagrams

**Deep Research**: Advanced AI agent for in-depth analysis

**Source**: Unit of content (file, URL, text) added to a notebook

**View**: Different output formats (Report, Dashboard, Infographic, etc.)

**Page**: Container within a notebook that holds sources and generated content

---

## Test Plan Approval

### Review and Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Plan Author | {Name} | | |
| Development Lead | {Name} | | |
| QA Lead | {Name} | | |
| Product Manager | {Name} | | |
| Project Manager | {Name} | | |

### Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-26 | {Author} | Initial comprehensive test plan |

---

**Document Status**: ✅ Ready for Implementation

**Next Steps**:
1. Set up test folder structure
2. Prepare test data and sample files
3. Begin automated test development
4. Execute initial manual test run
5. Generate first test report

---

*End of Test Plan Document*
