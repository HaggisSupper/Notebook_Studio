# Test Case Template

Use this template for documenting individual test cases.

---

## Test Case: {TEST_ID}

### Test Identifier
**ID**: {TEST_ID}  
**Version**: 1.0  
**Created**: {Date}  
**Last Updated**: {Date}

### Test Metadata

**Test Category**: {Category} - {Subcategory}  
**Test Priority**: [ ] Critical | [ ] High | [ ] Medium | [ ] Low  
**Test Type**: [ ] Automated | [ ] Manual | [ ] Both  
**Automation Status**: [ ] Not Automated | [ ] Partially Automated | [ ] Fully Automated

### Purpose

{Clear, concise description of what this test validates. Should be 2-3 sentences explaining the objective and why this test is important.}

### Scope

**Features Tested**:
- {Feature 1}
- {Feature 2}

**Components Involved**:
- {Component 1}
- {Component 2}

**Out of Scope**:
- {What is NOT tested by this test case}

### Preconditions

List all setup requirements before test execution:

1. {Precondition 1 - e.g., "Application is running on localhost:3000"}
2. {Precondition 2 - e.g., "Gemini API key is configured"}
3. {Precondition 3 - e.g., "Test data files are available in Test Inputs/"}
4. {Precondition n}

### Test Data

**Input Files**:
- File 1: `{path/to/file}`
- File 2: `{path/to/file}`

**Test Prompts**:
- Reference: `Test Inputs/prompts/{prompt_file}.json`
- Specific prompt: "{Exact prompt text used}"

**Configuration Settings**:
- Complexity Level: {Simple|Standard|Detailed|Comprehensive}
- Style Definition: {Any custom style instructions}
- LLM Provider: {Gemini|OpenRouter|Ollama}
- Model: {model name}

**SQL Schema** (if applicable):
- Schema file: `Test Inputs/sql_schemas/{schema_file}.sql`

### Test Steps

#### For Manual Tests:

1. **Step 1**: {Detailed description of action}
   - Expected result: {What should happen}
   
2. **Step 2**: {Detailed description of action}
   - Expected result: {What should happen}
   
3. **Step 3**: {Detailed description of action}
   - Expected result: {What should happen}

{Continue for all steps...}

#### For Automated Tests:

**Test File**: `{path/to/test.spec.ts}`

**Test Function**:
```typescript
describe('{Test Suite Name}', () => {
  it('{Test case description}', async () => {
    // Test implementation
  });
});
```

**Command to Run**:
```bash
npm run test -- {test-file-path}
```

### Expected Outcome

**Primary Success Criteria**:
- {Criterion 1 - Specific, measurable expectation}
- {Criterion 2}
- {Criterion 3}

**Output Characteristics**:
- Content quality: {Description}
- Format: {Expected format}
- Length: {Expected length range}
- Structure: {Expected structure}

**Performance Expectations**:
- Execution time: {Expected duration}
- Response time: {Expected response time}

### Actual Outcome

**Execution Date**: {Date and time}  
**Executed By**: {Tester name}  
**Environment**: {Browser, OS, Node version}

**Results**:
{Detailed description of what actually happened. Be specific about:}
- What worked as expected
- What differed from expectations
- Any error messages or issues
- Performance observations

**Metrics**:
- Execution time: {Actual time}
- Output length: {Actual length}
- Quality rating: {1-5 stars or assessment}

### Status

**Current Status**: [ ] Not Started | [ ] In Progress | [ ] Passed | [ ] Failed | [ ] Blocked

**Pass/Fail Criteria**:
- [ ] All expected outcomes achieved
- [ ] No critical defects found
- [ ] Performance within acceptable range
- [ ] Output quality meets standards

**If Failed - Reason**:
{Explanation of why the test failed}

**If Blocked - Blocker**:
{Explanation of what is preventing test execution}

### Evidence and Artifacts

#### Screenshots

Location: `Test Outputs/Screenshots/{category}/`

1. **Screenshot 1**: `{filename}.png`
   - Description: {What this screenshot shows}
   - Purpose: {Why this screenshot is relevant}

2. **Screenshot 2**: `{filename}.png`
   - Description: {What this screenshot shows}
   - Purpose: {Why this screenshot is relevant}

#### Output Files

Location: `Test Outputs/{view_type}/`

1. **Output 1**: `{filename}`
   - Type: {File type}
   - Size: {File size}
   - Description: {What this file contains}

#### Logs

1. **Test Execution Log**:
   - File: `Test Inputs/test_log.json`
   - Entry ID: {Specific entry for this test}

2. **Transform Log** (for SQL tests):
   - File: `Test Outputs/sql_transforms/transform_log_{testid}.json`
   - Operations logged: {Number of operations}

3. **Console Logs** (if errors occurred):
   ```
   {Paste relevant console output}
   ```

### Compliance Assessment

#### Current Implementation

**Compliance Status**: [ ] Fully Compliant | [ ] Partially Compliant | [ ] Non-Compliant

**Assessment**:
{Evaluation of how well the current implementation meets baseline feature requirements}

**Strengths**:
- {Strength 1}
- {Strength 2}

**Weaknesses**:
- {Weakness 1}
- {Weakness 2}

#### Requirements for Feature Compliance

To achieve baseline feature compliance, the following are needed:

- [ ] {Requirement 1 - Specific, actionable}
- [ ] {Requirement 2}
- [ ] {Requirement 3}
- [ ] {Requirement n}

**Priority**: [ ] High | [ ] Medium | [ ] Low  
**Estimated Effort**: {Hours or story points}

### Premium Enhancement Assessment

#### Current vs Premium Gap Analysis

**Gap Summary**:
{High-level comparison between current implementation and premium/enterprise-grade expectations}

**Missing Premium Features**:
1. {Missing feature 1}
2. {Missing feature 2}
3. {Missing feature 3}

#### Requirements for Premium Status

To elevate this feature to premium/enterprise tier:

##### Essential (P1)
- [ ] {Critical premium requirement 1}
- [ ] {Critical premium requirement 2}

##### Important (P2)
- [ ] {Important premium requirement 1}
- [ ] {Important premium requirement 2}

##### Nice-to-Have (P3)
- [ ] {Desirable premium feature 1}
- [ ] {Desirable premium feature 2}

**Implementation Roadmap**:
- Phase 1 (P1 items): {Estimated duration}
- Phase 2 (P2 items): {Estimated duration}
- Phase 3 (P3 items): {Estimated duration}

### Defects and Issues

#### Issues Found

| Issue ID | Severity | Description | Status |
|----------|----------|-------------|--------|
| {ID} | Critical/High/Medium/Low | {Description} | Open/In Progress/Resolved |

#### Issue Details

**Issue 1**: {Issue ID}
- **Severity**: {Critical|High|Medium|Low}
- **Description**: {Detailed description}
- **Steps to Reproduce**: {How to reproduce this issue}
- **Expected Behavior**: {What should happen}
- **Actual Behavior**: {What actually happens}
- **Workaround**: {Any temporary workaround, if available}
- **Assigned To**: {Developer name}
- **Target Fix Version**: {Version number}

### Dependencies

**Depends On**:
- {TEST-ID-1}: {Reason for dependency}
- {TEST-ID-2}: {Reason for dependency}

**Blocked By**:
- {Issue or requirement that blocks this test}

**Blocks**:
- {Other tests that depend on this test}

### Related Tests

**Related Test Cases**:
- {TEST-ID-1}: {Relationship description}
- {TEST-ID-2}: {Relationship description}

**Regression Tests**:
- {Tests that should be run if this area changes}

### Notes and Observations

**Additional Notes**:
{Any other observations, insights, or context not covered above}

**Recommendations**:
1. {Recommendation 1}
2. {Recommendation 2}

**Future Enhancements**:
- {Possible future improvement 1}
- {Possible future improvement 2}

### Review and Approval

**Reviewed By**: {Reviewer name}  
**Review Date**: {Date}  
**Review Status**: [ ] Approved | [ ] Needs Revision | [ ] Rejected

**Reviewer Comments**:
{Any feedback from reviewer}

**Approved By**: {Approver name}  
**Approval Date**: {Date}

### Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {Date} | {Author} | Initial creation |
| 1.1 | {Date} | {Author} | {Changes made} |

---

## Instructions for Using This Template

### Before Test Execution

1. Copy this template and name it with the test ID
2. Fill in all metadata fields
3. Define clear test steps
4. Specify expected outcomes
5. Gather required test data
6. Get review and approval

### During Test Execution

1. Execute test steps precisely as documented
2. Document actual outcomes thoroughly
3. Capture screenshots at key points
4. Save all output files with proper naming
5. Log any issues or anomalies

### After Test Execution

1. Update status and results
2. Complete compliance assessment
3. Document any defects found
4. Provide recommendations
5. Submit for review

### Maintenance

1. Update when requirements change
2. Review periodically for accuracy
3. Archive obsolete test cases
4. Version control all changes

---

*Template Version: 1.0*  
*Last Updated: 2024-12-26*
