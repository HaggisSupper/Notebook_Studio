# Notebook Studio

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Testing

A comprehensive test plan is available for Notebook Studio. See the testing documentation:

- **[TEST_PLAN.md](TEST_PLAN.md)** - Complete test plan with 100+ test cases
- **[TEST_QUICKSTART.md](TEST_QUICKSTART.md)** - Quick start guide for testers
- **[TEST_CASE_TEMPLATE.md](TEST_CASE_TEMPLATE.md)** - Template for test documentation
- **[TESTING.md](TESTING.md)** - Manual testing procedures

### Run Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Run E2E tests
npx playwright test
```

### Test Structure

- `Test Inputs/` - Test prompts and sample data
- `Test Outputs/` - Generated outputs and screenshots
- `Test Reports/` - Test run and compliance reports
