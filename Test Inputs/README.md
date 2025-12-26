# Test Inputs Directory

This directory contains all test input materials for Notebook Studio testing.

## Directory Structure

### `/prompts/`
Contains JSON files with test prompts for each view type at different complexity levels.

**Files**:
- `report_prompts.json` - Prompts for report generation
- `dashboard_prompts.json` - Prompts for dashboard generation
- `table_prompts.json` - Prompts for table generation
- `chat_prompts.json` - Prompts for chat interactions

### `/sample_files/`
Contains sample files for testing file upload and ingestion functionality.

#### Subdirectories:
- **`text_samples/`** - Text and Markdown files
- **`code_samples/`** - Code files (.js, .ts, .py, etc.)
- **`data_samples/`** - CSV and JSON data files
- **`image_samples/`** - Image files (PNG, JPG, GIF)
- **`audio_samples/`** - Audio files (MP3, WAV)
- **`pptx_samples/`** - PowerPoint files

### `/sql_schemas/`
Contains SQL schema files for testing SQL Bridge functionality.

**Files**:
- `ecommerce_schema.sql` - Sample e-commerce database schema

### `/test_log.json`
Master test log file that tracks all test executions, inputs, and parameters.

## Usage

### Adding New Test Prompts

1. Create or edit the appropriate JSON file in `/prompts/`
2. Follow the structure:
```json
{
  "description": "Purpose of these prompts",
  "category": "view_type",
  "prompts": {
    "simple": ["prompt1", "prompt2"],
    "standard": ["prompt1", "prompt2"],
    "detailed": ["prompt1", "prompt2"],
    "comprehensive": ["prompt1", "prompt2"]
  }
}
```

### Adding Sample Files

1. Place files in the appropriate subdirectory under `/sample_files/`
2. Use descriptive names: `{purpose}_{type}_{number}.{ext}`
3. Document any special characteristics in a README within that subdirectory

### Updating Test Log

The test log is automatically updated during test execution, but can be manually edited:

```json
{
  "testRuns": [
    {
      "testId": "TEST-ID-001",
      "timestamp": "ISO-8601-timestamp",
      "tester": "Name",
      "status": "Passed/Failed/Blocked",
      "inputs": { ... },
      "outputs": { ... },
      "notes": "Any observations"
    }
  ]
}
```

## Best Practices

1. **Version Control**: Commit all test input files to git
2. **Documentation**: Document the purpose of each test file
3. **Organization**: Keep files organized by type and purpose
4. **Naming**: Use consistent, descriptive names
5. **Size**: Keep sample files reasonably sized (< 10MB)

## Test Data Guidelines

- **Text Files**: Should contain diverse content with various formatting
- **Code Files**: Include different programming languages and patterns
- **Data Files**: Include realistic data with various structures
- **Images**: Use different formats, sizes, and content types
- **SQL Schemas**: Represent realistic database structures

---

*Last Updated: 2024-12-26*
