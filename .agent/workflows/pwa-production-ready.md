---
description: Tasks to make Notebook Studio a production-ready PWA
---

## Phase 1: Critical Security & Infrastructure (MUST DO FIRST)

### Task 1.1: Remove Hardcoded API Keys
**Priority**: 🔴 CRITICAL  
**Time**: 2 hours  
**Files**: `vite.config.ts`, `services/llmService.ts`, `services/geminiService.ts`

- [ ] Remove `GEMINI_API_KEY` from environment variables
- [ ] Delete hardcoded `process.env.API_KEY` references
- [ ] Add `.env` to `.gitignore` (verify it's not committed)
- [ ] Clear any API keys from git history if needed

### Task 1.2: Implement User-Provided API Key System
**Priority**: 🔴 CRITICAL  
**Time**: 3 hours  
**Files**: `components/SettingsModal.tsx`, `types.ts`, `App.tsx`

- [ ] Add API key fields to `LLMSettings` interface
- [ ] Update SettingsModal with secure input field for Gemini API key
- [ ] Add OpenRouter API key field (already has this, verify it works)
- [ ] Add Tavily API key field for search functionality
- [ ] Implement API key validation (test key before saving)
- [ ] Show masked key after saving (e.g., `sk-...xyz123`)
- [ ] Add "Test Connection" button to verify keys work

### Task 1.3: Persist Settings to LocalStorage
**Priority**: 🔴 CRITICAL  
**Time**: 1 hour  
**Files**: `App.tsx`

- [ ] Create `useLocalStorage` custom hook
- [ ] Save `settings` to localStorage on change
- [ ] Load settings from localStorage on app mount
- [ ] Handle encryption for API keys (use `crypto-js` or similar)

---

## Phase 2: Offline Capability (BLOCKING PWA REQUIREMENT)

### Task 2.1: Remove CDN Dependencies
**Priority**: 🔴 CRITICAL  
**Time**: 2 hours  
**Files**: `index.html`, `package.json`, `tailwind.config.js`

#### Tailwind CSS
- [ ] Run `npm install -D tailwindcss postcss autoprefixer`
- [ ] Run `npx tailwindcss init -p`
- [ ] Create `src/index.css` with Tailwind directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [ ] Import CSS in `index.tsx`: `import './index.css'`
- [ ] Remove `<script src="https://cdn.tailwindcss.com"></script>` from index.html
- [ ] Test that styling still works

#### Remove ESM Import Maps
- [ ] Delete `<script type="importmap">` block from index.html (lines 20-31)
- [ ] Verify all dependencies are in package.json:
  - [x] react
  - [x] react-dom
  - [x] recharts
  - [x] @google/genai
  - [x] jszip
- [ ] Run `npm install` to ensure all deps are installed
- [ ] Test that app builds: `npm run build`

### Task 2.2: Update Service Worker
**Priority**: 🟡 HIGH  
**Time**: 2 hours  
**Files**: `sw.js`

- [ ] Update cache name to versioned: `studio-v1.0.0`
- [ ] Add Vite build output to cache:
  ```javascript
  const urlsToCache = [
    '/',
    '/index.html',
    '/assets/index.css',
    '/assets/index.js',
    '/manifest.json'
  ];
  ```
- [ ] Implement cache versioning (delete old caches on activate)
- [ ] Add runtime caching for API responses (stale-while-revalidate)
- [ ] Add offline fallback page
- [ ] Test offline mode works completely

### Task 2.3: Add Service Worker Update Notification
**Priority**: 🟡 HIGH  
**Time**: 1 hour  
**Files**: `App.tsx`, `index.tsx`

- [ ] Listen for service worker update events
- [ ] Show toast/banner when new version available
- [ ] Add "Reload" button to apply update
- [ ] Test update flow

---

## Phase 3: Data Persistence (CRITICAL UX)

### Task 3.1: Implement Notebook Auto-Save
**Priority**: 🔴 CRITICAL  
**Time**: 2 hours  
**Files**: `App.tsx`

- [ ] Create `useNotebookPersistence` custom hook
- [ ] Auto-save notebooks to localStorage on change (debounced)
- [ ] Auto-restore notebooks on mount
- [ ] Handle migration if schema changes
- [ ] Add "Last saved" timestamp display

### Task 3.2: Add Manual Export/Import
**Priority**: 🟡 HIGH  
**Time**: 2 hours  
**Files**: `components/Sidebar.tsx`

- [ ] Add "Export Notebook" button
  - Download as JSON file
  - Include all sources, pages, chat history
- [ ] Add "Import Notebook" button
  - File picker for .json files
  - Validate schema before importing
  - Handle merge or replace options
- [ ] Add "Export All" to download all notebooks

### Task 3.3: Optional - IndexedDB for Large Data
**Priority**: 🟢 LOW (Future Enhancement)  
**Time**: 4 hours  

- [ ] Install Dexie.js: `npm install dexie`
- [ ] Replace localStorage with IndexedDB for large datasets
- [ ] Useful for: image sources, large CSV files
- [ ] Migrate existing localStorage data

---

## Phase 4: UX Polish

### Task 4.1: Replace Browser Native Dialogs
**Priority**: 🟡 HIGH  
**Time**: 3 hours  
**Files**: `components/` (new files), `App.tsx`

- [ ] Create `components/ConfirmModal.tsx`
  - Used for delete confirmations
  - Props: message, onConfirm, onCancel
- [ ] Create `components/PromptModal.tsx`
  - Used for rename, create notebook
  - Props: label, placeholder, onSubmit, onCancel
- [ ] Replace all `window.prompt()` calls (4 locations):
  - `handleCreateNotebook` (App.tsx:114)
  - `handleRenameNotebook` 
  - `handleRenamePage`
- [ ] Replace all `window.confirm()` calls (2 locations):
  - `handleDeleteNotebook` (App.tsx:145)
  - `handleDeletePage` (App.tsx:198)
- [ ] Test all flows work correctly

### Task 4.2: Add Loading States & Error Boundaries
**Priority**: 🟡 HIGH  
**Time**: 2 hours  
**Files**: `App.tsx`, `components/ErrorBoundary.tsx`

- [ ] Create ErrorBoundary component
- [ ] Wrap app in ErrorBoundary
- [ ] Add skeleton loaders for content generation
- [ ] Improve error messages (more user-friendly)
- [ ] Add retry mechanism for failed API calls

### Task 4.3: Mobile Optimizations
**Priority**: 🟡 HIGH  
**Time**: 2 hours  
**Files**: Various component files

- [ ] Test on mobile devices (iOS Safari, Chrome Android)
- [ ] Fix any touch interaction issues
- [ ] Verify sidebar works on mobile
- [ ] Test keyboard doesn't obscure inputs
- [ ] Add touch-friendly button sizes
- [ ] Test PWA install flow on mobile

---

## Phase 5: PWA Manifest & Assets

### Task 5.1: Generate Real Icons
**Priority**: 🟡 HIGH  
**Time**: 1 hour  
**Files**: `public/icons/`, `manifest.json`

- [ ] Design app icon (512x512 minimum)
- [ ] Use PWA Asset Generator: `npx @vite-pwa/assets-generator`
- [ ] Generate all required sizes:
  - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- [ ] Generate maskable icon (Android)
- [ ] Generate favicon.ico and apple-touch-icon.png
- [ ] Update manifest.json with real icon paths

### Task 5.2: Enhance Manifest
**Priority**: 🟢 MEDIUM  
**Time**: 1 hour  
**Files**: `manifest.json`


- [ ] Validate manifest with Lighthouse

---

## Phase 6: Performance & Optimization

### Task 6.1: Code Splitting
**Priority**: 🟢 MEDIUM  
**Time**: 2 hours  
**Files**: `App.tsx`, Vite config


  ```
- [ ] Add Suspense boundaries with loading states
- [ ] Verify bundle size reduction
- [ ] Test lazy loading works offline

### Task 6.2: Image Optimization
**Priority**: 🟢 MEDIUM  
**Time**: 1 hour  
**Files**: `components/Sidebar.tsx`

- [ ] Compress uploaded images before storing
- [ ] Use WebP format when possible
- [ ] Limit image size (e.g., max 5MB)
- [ ] Add image dimension limits

### Task 6.3: Bundle Analysis
**Priority**: 🟢 LOW  
**Time**: 1 hour  

- [ ] Run `npm run build -- --analyze`
- [ ] Review bundle size
- [ ] Identify unnecessary dependencies
- [ ] Tree-shake unused code

---

## Phase 7: Testing & Quality Assurance

### Task 7.1: Lighthouse Audit
**Priority**: 🟡 HIGH  
**Time**: 2 hours  

- [ ] Run Lighthouse audit (PWA score)
- [ ] Fix issues to achieve 90+ score
- [ ] Performance: 90+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 90+

### Task 7.2: Cross-Browser Testing
**Priority**: 🟡 HIGH  
**Time**: 2 hours  

**Desktop**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile**:
- [ ] iOS Safari (iPhone)
- [ ] Chrome Android
- [ ] Samsung Internet

### Task 7.3: PWA Installation Testing
**Priority**: 🟡 HIGH  
**Time**: 1 hour  

- [ ] Test "Add to Home Screen" on Android
- [ ] Test "Add to Home Screen" on iOS
- [ ] Verify app opens in standalone mode
- [ ] Test app updates work after install
- [ ] Verify icons display correctly

### Task 7.4: Functional Testing
**Priority**: 🔴 CRITICAL  
**Time**: 3 hours  

- [ ] Create notebook → Add sources → Generate all views
- [ ] Test chat functionality with multimodal sources
- [ ] Test export/import notebooks
- [ ] Test deep research agent with tools
- [ ] Test all LLM providers (Google, OpenRouter, Local)
- [ ] Test offline mode (disconnect network, use cached data)
- [ ] Test data persistence (refresh, close tab, reopen)

---

## Phase 8: Security Hardening

### Task 8.1: Add Content Security Policy
**Priority**: 🟡 HIGH  
**Time**: 1 hour  
**Files**: `index.html`

- [ ] Add CSP meta tag:
  ```html
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; 
                 script-src 'self' 'unsafe-inline'; 
                 style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                 connect-src 'self' https://generativelanguage.googleapis.com https://openrouter.ai https://api.tavily.com;
                 img-src 'self' data: blob:;
                 font-src 'self' https://fonts.gstatic.com;">
  ```
- [ ] Test app still works with CSP enabled

### Task 8.2: Sanitize User Inputs
**Priority**: 🟡 HIGH  
**Time**: 1 hour  
**Files**: Various components

- [ ] Install DOMPurify: `npm install dompurify`
- [ ] Sanitize all user-generated content before rendering
- [ ] Validate file uploads (type, size)
- [ ] Prevent XSS in chat messages

### Task 8.3: Rate Limiting (Frontend)
**Priority**: 🟢 MEDIUM  
**Time**: 1 hour  
**Files**: `services/llmService.ts`

- [ ] Add request throttling to prevent API abuse
- [ ] Show user feedback when rate limited
- [ ] Implement exponential backoff on errors

---

## Phase 9: Deployment

### Task 9.1: Choose Hosting Platform
**Priority**: 🟡 HIGH  
**Time**: 15 minutes  

Select one:
- [ ] **Vercel** (Recommended - easiest)
- [ ] **Netlify** (Good alternative)
- [ ] **Cloudflare Pages** (Best performance)
- [ ] **GitHub Pages** (Free but limited)

### Task 9.2: Configure Build
**Priority**: 🟡 HIGH  
**Time**: 30 minutes  
**Files**: `package.json`, hosting config

- [ ] Update build command if needed
- [ ] Set output directory: `dist`
- [ ] Configure environment variables (if using backend)
- [ ] Test production build locally: `npm run build && npm run preview`

