# Implementation Tasks

## Task 1: Project Setup & Configuration
- [x] Initialize Next.js 14 project with TypeScript, Tailwind CSS, pnpm
- [x] Install dependencies: zustand, react-dropzone, react-compare-slider, lucide-react
- [x] Setup shadcn/ui with dark theme configuration
- [x] Configure tailwind.config.ts with custom dark theme colors
- [x] Create project folder structure (app/, components/, lib/, stores/, types/)
- [x] Setup .env.local template
- [x] Configure next.config.js for image domains (magnific CDN)

**Requirements:** R14 (Layout)

## Task 2: Type Definitions & Constants
- [x] Create types/api.ts — Magnific API request/response interfaces
- [x] Create types/task.ts — Task status, TaskResult, TaskType enums
- [x] Create types/models.ts — Model configurations and options
- [x] Create lib/constants.ts — Rate limits, API endpoints, timeouts, defaults
- [x] Create lib/validators.ts — Input validation functions (file size, format, prompt length)

**Requirements:** R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R13

## Task 3: Zustand Stores
- [x] Create stores/auth-store.ts — API key management with localStorage persist
- [x] Create stores/task-store.ts — Task queue with max 100 records, persist
- [x] Create stores/rate-limit-store.ts — Rate limit counters with daily reset logic
- [x] Create stores/history-store.ts — Result history with max 50 items, eviction policy

**Requirements:** R1, R12, R13, R16

## Task 4: API Proxy Route
- [x] Create app/api/magnific/[...path]/route.ts — Catch-all proxy handler
- [x] Implement request forwarding with x-magnific-api-key header injection
- [x] Handle multipart/form-data forwarding for image uploads
- [x] Handle JSON body forwarding for text-only requests
- [x] Implement error response mapping (401, 429, 5xx)
- [x] Add request timeout handling (55 seconds to stay within Vercel limit)

**Requirements:** R1, R17

## Task 5: Core Library Functions
- [x] Create lib/api-client.ts — Fetch wrapper that reads API key from store, calls /api/magnific
- [x] Create lib/task-poller.ts — Polling logic with configurable interval, timeout, AbortController
- [x] Create lib/utils.ts — File helpers (formatBytes, generateFilename, createObjectURL)

**Requirements:** R1, R12, R17

## Task 6: Layout & Navigation
- [x] Create app/layout.tsx — Root layout with dark theme, font loading
- [x] Create components/layout/sidebar.tsx — Desktop sidebar with nav links and rate display summary
- [x] Create components/layout/mobile-nav.tsx — Hamburger menu overlay for mobile
- [x] Create components/layout/header.tsx — Top bar with app title, settings gear icon
- [x] Create app/(dashboard)/layout.tsx — Dashboard layout wrapping sidebar + content area
- [x] Implement responsive breakpoint logic (768px collapse)
- [x] Add active route highlighting in sidebar

**Requirements:** R14

## Task 7: API Key Setup Page
- [x] Create app/(auth)/setup/page.tsx — API key input form
- [x] Add validation (non-empty, max 256 chars)
- [x] Add "Get API Key" link to magnific.com/developers/dashboard
- [x] Implement redirect logic (middleware or client-side guard)
- [x] Add "Remove Key" button in settings area of sidebar

**Requirements:** R1

## Task 8: Shared Components
- [x] Create components/shared/image-upload.tsx — Drag-and-drop + file picker with validation
- [x] Create components/shared/image-preview.tsx — Preview with remove button
- [ ] Create components/shared/image-comparison.tsx — Before/after slider wrapper
- [ ] Create components/shared/video-player.tsx — HTML5 video with controls + download
- [x] Create components/shared/task-status.tsx — Status badge + progress indicator
- [x] Create components/shared/download-button.tsx — Download with generated filename
- [x] Create components/shared/prompt-input.tsx — Textarea with char counter
- [ ] Create components/shared/model-selector.tsx — Dropdown with model info tooltips

**Requirements:** R15, R16, R12

## Task 9: Image Generation Page
- [x] Create app/(dashboard)/generate/page.tsx
- [x] Create components/generate/generate-form.tsx
- [x] Implement model selector (Mystic, Flux Dev, Flux Pro 1.1, Classic Fast)
- [x] Add prompt textarea with 2000 char limit
- [ ] Add dimension controls (width/height sliders, 256-1920px, step 8)
- [x] Add model-specific controls (creativity for Mystic, guidance/steps for Flux)
- [x] Integrate task-poller on submit (3s interval, 120s timeout)
- [x] Display generated image in gallery with download button
- [x] Wire up rate limit decrement on successful submission

**Requirements:** R2, R12, R13

## Task 10: AI Image Upscaler Page
- [x] Create app/(dashboard)/upscale/page.tsx
- [x] Create components/upscale/upscale-form.tsx
- [x] Implement mode toggle: Creative vs Precision (v1/v2)
- [x] Add image upload with 10MB limit, JPEG/PNG/WebP validation
- [x] Add creativity slider (1-5) and optional prompt for Creative mode
- [x] Add v1/v2 selector for Precision mode
- [x] Integrate task-poller (3s interval, 60s timeout)
- [ ] Display before/after comparison slider on completion

**Requirements:** R3, R12, R13, R15

## Task 11: AI Image Expand Page
- [x] Create app/(dashboard)/expand/page.tsx
- [x] Create components/expand/expand-form.tsx
- [x] Implement direction selector (top/bottom/left/right checkboxes)
- [x] Add pixel size inputs per direction (1-1024px)
- [x] Add optional prompt textarea (500 chars)
- [ ] Add visual canvas preview showing expansion areas
- [x] Integrate task-poller (3s interval, 120s timeout)
- [x] Display expanded result with download

**Requirements:** R4, R12, R13, R15

## Task 12: AI Image Relight Page
- [x] Create app/(dashboard)/relight/page.tsx
- [x] Create components/relight/relight-form.tsx
- [x] Add image upload with 20MB limit validation
- [x] Add lighting prompt textarea (500 chars)
- [x] Add preset lighting suggestions (e.g., "golden hour", "neon", "studio")
- [x] Integrate task-poller (3s interval, 120s timeout)
- [ ] Display before/after comparison on completion

**Requirements:** R5, R12, R13, R15

## Task 13: Change Camera Page
- [x] Create app/(dashboard)/camera/page.tsx
- [x] Create components/camera/camera-form.tsx
- [x] Add rotation angle slider (-180 to +180)
- [x] Add vertical tilt slider (-90 to +90)
- [x] Add horizontal pan slider (-90 to +90)
- [x] Add zoom level slider (0.5x to 3.0x)
- [x] Add validation preventing out-of-range values
- [x] Integrate task-poller (3s interval, 60s timeout)
- [ ] Display before/after comparison on completion

**Requirements:** R6, R12, R13, R15

## Task 14: AI Video Generation Page
- [x] Create app/(dashboard)/video/page.tsx
- [x] Create components/video/video-form.tsx
- [x] Implement model tier selector (V3 Standard, V3 Pro, Standard, Pro, Advanced)
- [x] Add image upload (optional) with 10MB limit
- [x] Add prompt textarea (500 chars)
- [x] Add duration selector (5s / 10s)
- [x] Display estimated generation time per tier
- [x] Integrate task-poller (5s interval, 600s timeout)
- [x] Display video player with controls on completion
- [x] Show "try lower tier" suggestion on failure

**Requirements:** R7, R12, R13, R15

## Task 15: Motion Control Video Page
- [x] Create app/(dashboard)/motion/page.tsx
- [x] Create components/motion/motion-form.tsx
- [ ] Create components/motion/motion-canvas.tsx — Visual overlay for motion vectors
- [x] Create components/motion/motion-presets.tsx — Preset template buttons
- [x] Implement model selector (V3 MC Pro / V3 MC Standard)
- [x] Add camera motion sliders (pan, tilt, zoom, rotate: -10 to +10)
- [ ] Add subject motion vector control (360° direction on image)
- [x] Implement 5 preset templates (zoom in, zoom out, pan left, pan right, orbit)
- [x] Allow combining up to 4 motion types
- [x] Add prompt textarea (2500 chars)
- [x] Integrate task-poller (5s interval, 600s timeout)
- [x] Display video player on completion

**Requirements:** R8, R12, R13, R15

## Task 16: Prompt Tools Page
- [x] Create app/(dashboard)/prompt-tools/page.tsx
- [x] Create components/prompt-tools/image-to-prompt.tsx
- [x] Create components/prompt-tools/improve-prompt.tsx
- [x] Image-to-Prompt: upload image → display extracted prompt → "Use in Generator" button
- [x] Improve Prompt: input textarea → display improved prompt → iterate (max 10x)
- [x] Add copy-to-clipboard button for generated/improved prompts
- [x] Navigate to /generate with pre-filled prompt on "Use in Generator" click
- [x] Handle 30s timeout for both endpoints

**Requirements:** R9, R10, R12, R13

## Task 17: Icon Generation Page
- [x] Create app/(dashboard)/icons/page.tsx
- [x] Create components/icons/icon-form.tsx
- [x] Add description textarea (1-500 chars)
- [x] Add style selector (flat, outlined, filled, gradient, hand-drawn)
- [ ] Add preview option (64×64 quick preview)
- [ ] Add full generation (512×512)
- [x] Display icon with download in PNG/SVG/ICO formats
- [x] Handle 30s timeout

**Requirements:** R11, R12, R13

## Task 18: Task Queue Page
- [x] Create app/(dashboard)/tasks/page.tsx
- [x] Display all active + recent 50 completed/failed tasks
- [x] Show status badges (PENDING, PROCESSING, COMPLETED, FAILED)
- [x] Show progress indicator for active tasks
- [x] Add "View Result" button for completed tasks
- [ ] Add toast notification on task completion
- [x] Implement localStorage persistence with 100 record max
- [x] Handle localStorage quota exceeded (evict oldest)

**Requirements:** R12

## Task 19: History Page
- [x] Create app/(dashboard)/history/page.tsx
- [x] Display thumbnail grid of past 50 results
- [x] Show timestamp and task type label per item
- [ ] Click to view full result with original parameters
- [ ] Handle expired URLs with placeholder
- [x] Add "Remove" button per history item
- [x] Implement eviction when localStorage full

**Requirements:** R16

## Task 20: Error Handling & Rate Limit UI
- [ ] Implement global error boundary component
- [ ] Add retry button logic (max 3 attempts, 2s delay between)
- [ ] Handle 401 → redirect to API key setup
- [ ] Handle 429 → show rate limit message with retry-after countdown
- [ ] Handle 5xx → show server error with retry
- [ ] Handle network errors → show connection error with retry
- [ ] Add rate limit display widget in sidebar (compact view per category)
- [ ] Disable submit buttons when quota exhausted
- [ ] Implement daily reset at UTC midnight

**Requirements:** R13, R17

## Task 21: Final Polish & Deployment
- [ ] Add loading skeletons for all pages
- [ ] Add page transitions/animations
- [ ] Test responsive layout at 320px, 768px, 1024px, 1920px
- [ ] Add meta tags and favicon
- [ ] Create README.md with setup instructions
- [ ] Configure vercel.json if needed
- [ ] Deploy to Vercel
- [ ] Test all features end-to-end with real API key

**Requirements:** R14, All
