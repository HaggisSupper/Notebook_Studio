# Quick Start Guide: Notebook Studio Test Plan

This guide helps you quickly get started with the comprehensive test plan.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Git repository cloned
- Gemini API key (for testing content generation)

## Initial Setup (5 minutes)

### 1. Install Dependencies
```bash
cd Notebook_Studio
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### 3. Verify Test Structure
```bash
# Check that test folders exist
ls -la "Test Inputs"
ls -la "Test Outputs"
ls -la "Test Reports"
```

All directories should be present with README files.

## Running Automated Tests (2 minutes)

### Run All Unit Tests
```bash
npm run test:unit
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm run test -- src/services/llmService.test.ts
```

### Run E2E Tests
```bash
npx playwright test
```

## Executing Manual Tests (10-30 minutes per test)

### 1. Start the Application
```bash
npm run dev
```

Application will be available at http://localhost:3000

### 2. Open Test Case Template
Open `TEST_CASE_TEMPLATE.md` and copy it to create a new test case:

```bash
cp TEST_CASE_TEMPLATE.md "test_cases/FUNC-REPORT-001.md"
```

### 3. Follow Test Steps

Example: Testing Report Generation

1. **Load test data**
   - Copy sample file: `Test Inputs/sample_files/text_samples/technology_trends.txt`
   - Click "+" button in sidebar
   - Select "Upload File"
   - Choose the sample file

2. **Configure settings**
   - Click "Style" button
   - Select "Simple" complexity
   - Click "Apply Settings"

3. **Generate content**
   - Click "REPORT" in navigation
   - Click "Execute Single View"
   - Wait for generation to complete

4. **Save output**
   - Copy generated report
   - Save to: `Test Outputs/reports/report_simple_FUNC-REPORT-001.md`

5. **Take screenshot**
   - Capture the report view
   - Save to: `Test Outputs/Screenshots/views/report_simple_FUNC-REPORT-001.png`

6. **Document results**
   - Update test case file with actual outcomes
   - Mark status as Passed/Failed
   - Add any notes or observations

### 4. Update Test Log
Edit `Test Inputs/test_log.json` and add entry:

```json
{
  "testRuns": [
    {
      "testId": "FUNC-REPORT-001",
      "timestamp": "2024-12-26T10:30:00Z",
      "tester": "Your Name",
      "status": "Passed",
      "duration": "120s",
      "inputs": {
        "prompts": ["Generate a report about AI trends"],
        "sources": ["technology_trends.txt"],
        "settings": {
          "complexity": "Simple"
        }
      },
      "outputs": {
        "file": "Test Outputs/reports/report_simple_FUNC-REPORT-001.md",
        "screenshots": [
          "Test Outputs/Screenshots/views/report_simple_FUNC-REPORT-001.png"
        ]
      },
      "notes": "Generation successful"
    }
  ]
}
```

## Testing Output Levels (15-20 minutes)

For comprehensive testing, test each feature at all complexity levels:

```bash
# For Report generation:
# 1. Simple level → Save as report_simple_TESTID.md
# 2. Standard level → Save as report_standard_TESTID.md
# 3. Detailed level → Save as report_detailed_TESTID.md
# 4. Comprehensive level → Save as report_comprehensive_TESTID.md
```

Compare outputs to verify appropriate progression in depth and detail.

## Creating a Test Report (30-60 minutes)

After completing a test run:

1. **Copy the template** from `TEST_PLAN.md` Section 11.1
2. **Create new report file**:
   ```bash
   # Format: test_run_YYYYMMDD_###.md
   touch "Test Reports/test_run_20241226_001.md"
   ```
3. **Fill in all sections**:
   - Purpose and scope
   - Test execution results
   - Defects found
   - Compliance assessment
   - Recommendations
4. **Submit for review**

## Common Test Scenarios

### Scenario 1: Basic Functionality Test
**Time**: 10 minutes

1. Start app
2. Create new notebook
3. Add text source
4. Generate report (Standard level)
5. Verify output quality
6. Export notebook

### Scenario 2: Multimodal Content Test
**Time**: 15 minutes

1. Upload text file
2. Upload image file
3. Generate infographic
4. Verify image context is used
5. Save output and screenshot

### Scenario 3: SQL Bridge Test
**Time**: 20 minutes

1. Click "DB Connect"
2. Enter server: "localhost"
3. Enter database: "TestDB"
4. Paste schema from `Test Inputs/sql_schemas/ecommerce_schema.sql`
5. Click "Establish Bridge"
6. Go to Chat
7. Ask: "What tables are available?"
8. Generate table view
9. Export transform log
10. Verify log structure

### Scenario 4: Canvas Editing Test
**Time**: 10 minutes

1. Click "CANVAS"
2. Click "Mermaid" mode
3. Click "Load Example"
4. Click "Preview"
5. Verify diagram renders
6. Click "Export SVG"
7. Verify SVG downloads

## Troubleshooting

### Issue: Tests failing with API errors
**Solution**: 
- Check that `GEMINI_API_KEY` is set in `.env.local`
- Verify API key is valid
- Check internet connection

### Issue: Can't see test folders
**Solution**:
```bash
# Recreate folders if needed
mkdir -p "Test Inputs/prompts"
mkdir -p "Test Outputs/reports"
mkdir -p "Test Reports"
```

### Issue: Build fails
**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: E2E tests fail
**Solution**:
```bash
# Install Playwright browsers
npx playwright install
npx playwright test
```

## Test Priority Guide

### Critical Priority (Do First)
- Core functionality tests (notebook, source management)
- Content generation for each view type
- File upload and processing
- Basic UI navigation

### High Priority (Do Next)
- Output level testing (all 4 levels)
- SQL Bridge functionality
- Settings and configuration
- Export functionality

### Medium Priority (Do After High)
- Advanced features (Deep Research, Canvas)
- Multi-provider API testing
- Responsive design testing
- Integration scenarios

### Low Priority (Do Last)
- Performance testing
- Edge cases
- Browser compatibility
- Accessibility testing

## Time Estimates

| Activity | Time |
|----------|------|
| Initial setup | 5 min |
| Single automated test run | 2 min |
| Single manual test case | 10-30 min |
| Output level testing (4 levels) | 15-20 min |
| Complete test run (20 tests) | 4-6 hours |
| Test report creation | 30-60 min |
| Full test cycle | 1-2 days |

## Next Steps

1. ✅ Review `TEST_PLAN.md` in detail
2. ✅ Set up your test environment
3. ✅ Run existing automated tests
4. ✅ Execute your first manual test case
5. ✅ Document results thoroughly
6. ✅ Create your first test report
7. ✅ Identify and log any defects
8. ✅ Provide compliance recommendations

## Resources

- **Main Test Plan**: `TEST_PLAN.md`
- **Test Case Template**: `TEST_CASE_TEMPLATE.md`
- **Existing Testing Guide**: `TESTING.md`
- **Test Deficiency Report**: `TEST_DEFICIENCY_REPORT.md`
- **Test Inputs**: `Test Inputs/` directory
- **Test Outputs**: `Test Outputs/` directory
- **Test Reports**: `Test Reports/` directory

## Support

For questions or issues:
1. Review the comprehensive `TEST_PLAN.md`
2. Check existing test documentation
3. Consult with QA lead or development team

---

**Good luck with testing!** 🚀

*Last Updated: 2024-12-26*
