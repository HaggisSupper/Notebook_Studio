# Testing Guide for Notebook Studio Enhancements

## Overview
This document outlines the testing procedures for the recent enhancements to Notebook Studio.

## 1. UI Color Changes (Lightened by 2 Shades)

### Testing Steps:
1. Start the application: `npm run dev`
2. Navigate to http://localhost:3000
3. **Verify Background Colors:**
   - Main background should be `neutral-700` (lighter gray)
   - Header/navigation bar should be `neutral-700`
   - Chat interface should be `neutral-700/95`
   - Modals should be `neutral-600`

### Expected Results:
- ✓ Overall UI is 2 shades lighter than before
- ✓ Text remains readable with proper contrast
- ✓ Dark mode aesthetic is maintained but less heavy

## 2. Orange Borders & Glow Effects

### Testing Steps:
1. **Hover States:**
   - Hover over navigation buttons (Report, Dashboard, etc.)
   - Hover over action buttons (⚡, ⚙)
   - Hover over the "Style" and "DB Connect" buttons
   - Hover over input fields

2. **Focus States:**
   - Click on any button
   - Tab through interactive elements
   - Focus on input fields and textareas

### Expected Results:
- ✓ All interactive elements show orange border (`border-orange-500`) on hover
- ✓ Focused elements show orange glow effect
- ✓ Glow effect: `shadow-[0_0_10px_rgba(249,115,22,0.5)]`
- ✓ Smooth transitions between states

## 3. Canvas View with Mermaid & Markdown

### Testing Steps:
1. Click on "CANVAS" in the main navigation
2. **Test Markdown Mode:**
   - Click "Load Example" to load sample markdown
   - Type some markdown in the editor
   - Click "👁️ Preview" to see rendered output
   - Verify: headers, lists, code blocks, tables, links

3. **Test Mermaid Mode:**
   - Click "Mermaid" button to switch modes
   - Click "Load Example" to load sample diagram
   - Click "👁️ Preview" to render the diagram
   - Click "Export SVG" to download the diagram

### Expected Results:
- ✓ Canvas view accessible from navigation
- ✓ Markdown renders correctly with styling
- ✓ Mermaid diagrams render with dark theme
- ✓ SVG export downloads a valid SVG file
- ✓ Toggle between edit and preview modes works
- ✓ Mode switching (Markdown ↔ Mermaid) works

## 4. Mindmap with Mermaid Support

### Testing Steps:
1. Add some text sources to a notebook
2. Click "MINDMAP" in navigation
3. Click "Execute Single View" to generate a mindmap
4. After generation, click "Mermaid View" button
5. Click "Export SVG" to download

### Expected Results:
- ✓ Traditional tree view displays correctly
- ✓ Toggle to Mermaid view works
- ✓ Mermaid mindmap renders
- ✓ SVG export works for mindmaps
- ✓ Can switch back to tree view

## 5. Complexity & Style Definition Controls

### Testing Steps:
1. Click the "Style" button in the header
2. Select a complexity level (e.g., "Detailed")
3. Enter style instructions (e.g., "Use professional tone with examples")
4. Click "Apply Settings"
5. Generate any content type (Report, Infographic, etc.)
6. Verify the generated content reflects the settings

### Expected Results:
- ✓ Style modal opens with complexity dropdown
- ✓ Style textarea accepts custom instructions
- ✓ Settings save when "Apply Settings" clicked
- ✓ Generated content uses complexity and style settings
- ✓ Settings persist per page

## 6. SQL Connection with Transform Logging

### Testing Steps:
1. Click "DB Connect" button
2. Enter server name (e.g., "localhost")
3. Enter database name (e.g., "TestDB")
4. Paste sample SQL schema:
```sql
CREATE TABLE Users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

CREATE TABLE Orders (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2),
  order_date DATE
);
```
5. Click "Establish Bridge"
6. In chat, ask: "Show me total orders by user"
7. Generate a Table view
8. Return to DB Connect modal
9. Check transform log display
10. Click "Export Log" to download JSON

### Expected Results:
- ✓ SQL connection activates (green indicator)
- ✓ Transform log tracks query operations
- ✓ Transform log tracks table generations
- ✓ Log shows last 5 operations in modal
- ✓ Export creates valid JSON file with structure:
  ```json
  {
    "server": "localhost",
    "database": "TestDB",
    "exportDate": "ISO timestamp",
    "transforms": [
      {
        "timestamp": "ISO timestamp",
        "operation": "QUERY_EXECUTION",
        "description": "...",
        "inputFields": [...],
        "outputFields": [...],
        "calculation": "..."
      }
    ]
  }
  ```

## 7. Flat Table Output from SQL Conversations

### Testing Steps:
1. Connect to SQL (see test 6)
2. Have a conversation about the data:
   - "What tables are available?"
   - "Show me user information"
   - "Calculate total revenue per user"
3. Click "TABLE" in navigation
4. Click "Execute Single View"
5. Review generated table

### Expected Results:
- ✓ Table includes relevant fields from SQL schema
- ✓ JOINs are implied where appropriate
- ✓ Calculations are documented
- ✓ Table is flat (no nested structures)
- ✓ Transform log records the operation

## 8. OpenAI Compliant API Testing

### Testing Steps:
1. Click settings (⚙) button
2. Change "Orchestrator" to "OpenRouter API"
3. Enter an OpenRouter API key (or use Local Node for Ollama)
4. For Local Node:
   - Select "Local Node (Ollama)"
   - Set endpoint: `http://localhost:11434/v1`
   - Set model: `llama3.1`
5. Click "Save Protocol"
6. Try generating content

### Expected Results:
- ✓ OpenRouter connection works with valid API key
- ✓ Local Ollama connection works
- ✓ Error messages are clear for connection issues
- ✓ Content generation uses selected provider
- ✓ All features work with different providers

## 9. PowerPoint/Infographic Generation (VLM)

### Testing Steps:
1. Add an image source:
   - Click "+" button in sidebar
   - Select "Upload File"
   - Upload an image (PNG, JPG, etc.)
2. Add some text context
3. Click "SLIDES" or "INFOGRAPHIC" in navigation
4. Click "Execute Single View"
5. Review generated content

### Expected Results:
- ✓ System accepts image uploads
- ✓ Images are processed (base64 encoded)
- ✓ Slides generation includes image context
- ✓ Infographics incorporate visual data
- ✓ Multimodal analysis is evident in output

## 10. Navigation Functionality

### Testing Steps:
1. Test all navigation views:
   - REPORT
   - DASHBOARD
   - INFOGRAPHIC
   - MINDMAP
   - FLASHCARDS
   - SLIDES
   - TABLE
   - CANVAS
   - CHAT
2. Test on mobile (resize browser to <768px)
3. Switch between views multiple times
4. Test with and without generated content

### Expected Results:
- ✓ All 9 views are accessible
- ✓ Active view is highlighted with orange border/glow
- ✓ Mobile dropdown works correctly
- ✓ View switching is smooth and instant
- ✓ Content persists when switching views
- ✓ No console errors

## Build & Production Testing

### Testing Steps:
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Expected Results:
- ✓ Build completes without errors
- ✓ No TypeScript errors
- ✓ Bundle size is reasonable
- ✓ Preview runs correctly
- ✓ All features work in production build

## Browser Compatibility

Test in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

### Expected Results:
- ✓ UI renders consistently
- ✓ Mermaid diagrams work
- ✓ Markdown rendering works
- ✓ All interactions function properly

## Performance Testing

### Testing Steps:
1. Add 10+ sources to a notebook
2. Generate all views at once (⚡ button)
3. Monitor browser performance
4. Test with large markdown documents
5. Test with complex Mermaid diagrams

### Expected Results:
- ✓ No significant lag
- ✓ Memory usage is reasonable
- ✓ Large documents render without freezing
- ✓ Smooth scrolling

## Regression Testing

Verify existing features still work:
- ✓ Notebook creation/deletion
- ✓ Page management
- ✓ Source management (add/remove/reorder)
- ✓ Undo/Redo for sources
- ✓ Deep Research agent
- ✓ Export functionality
- ✓ Settings persistence

## Known Limitations

1. **SQL Connection**: This is a simulated connection. No actual TCP connection to SQL servers (browser security limitation).
2. **VLM Processing**: Requires valid API key and model that supports vision (e.g., Gemini Pro Vision, GPT-4 Vision).
3. **Mermaid Complexity**: Very complex diagrams may render slowly or fail.
4. **Browser Support**: Mermaid and advanced CSS features may not work in older browsers.

## Troubleshooting

### Issue: Colors not applied
- **Solution**: Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Mermaid not rendering
- **Solution**: Check browser console for errors. Ensure valid Mermaid syntax.

### Issue: API key errors
- **Solution**: Verify API key is valid and has proper permissions. Check provider settings.

### Issue: Dev server not starting
- **Solution**: Kill existing processes on port 3000: `kill -9 $(lsof -t -i:3000)`

## Success Criteria

All features should meet these criteria:
- ✓ Functionality works as described
- ✓ No console errors
- ✓ Performance is acceptable
- ✓ UI is consistent and polished
- ✓ Accessibility maintained
- ✓ Mobile responsive
- ✓ Build succeeds
