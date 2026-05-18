# Technical Design Document

## Overview

Magnific Web Tools is a Next.js 14 application deployed on Vercel's free tier that serves as a unified web interface for Magnific API's free-tier features. The app uses a serverless proxy architecture where API routes forward requests to Magnific's API, keeping the user's API key secure on the server side while the browser handles task polling and result display.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Image   │  │  Video   │  │  Prompt  │  │  Icon  │ │
│  │Generator │  │Generator │  │  Tools   │  │  Gen   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │              │             │       │
│  ┌────┴──────────────┴──────────────┴─────────────┴────┐ │
│  │              API Client (fetch wrapper)              │ │
│  └────────────────────────┬────────────────────────────┘ │
│                           │                              │
│  ┌────────────────────────┴────────────────────────────┐ │
│  │           Task Poller (client-side polling)          │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┴─────────────────────────────┐
│              Vercel Edge/Serverless Functions             │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  /api/magnific/[...path].ts  (catch-all proxy)      │ │
│  │  - Reads API key from encrypted cookie/header       │ │
│  │  - Forwards request to api.magnific.com             │ │
│  │  - Returns response to client                       │ │
│  └────────────────────────┬────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┴─────────────────────────────┐
│                 Magnific API                              │
│            https://api.magnific.com                       │
│                                                          │
│  - Image Generation (Mystic, Flux, Classic Fast)         │
│  - Image Editing (Upscaler, Expand, Relight, Camera)     │
│  - Video Generation (Kling variants)                     │
│  - AI Tools (Image-to-Prompt, Improve Prompt, Icons)     │
└─────────────────────────────────────────────────────────┘
```

### Request Flow (Async Pattern)

```
1. User submits form → POST /api/magnific/v1/ai/{endpoint}
2. Serverless function adds API key header → forwards to Magnific
3. Magnific returns { task_id, status: "CREATED" }
4. Client receives task_id → starts polling
5. Client polls GET /api/magnific/v1/ai/{endpoint}/{task_id} every 3-5s
6. When status === "COMPLETED" → display result URL
7. If timeout (120s for images, 600s for video) → show error
```

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14 (App Router) | SSR, API routes, file-based routing, Vercel-native |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS + shadcn/ui | Fast development, dark theme, accessible components |
| State Management | Zustand | Lightweight, no boilerplate, persist middleware for localStorage |
| HTTP Client | Native fetch | No extra dependency, works in both client and server |
| File Upload | react-dropzone | Battle-tested drag-and-drop |
| Video Player | Native HTML5 `<video>` | No dependency needed |
| Image Comparison | react-compare-slider | Before/after comparison for upscaler/relight |
| Icons | Lucide React | Consistent icon set, tree-shakeable |
| Deployment | Vercel (Hobby/Free) | Zero-config Next.js deployment |
| Package Manager | pnpm | Fast, disk-efficient |

## Project Structure

```
magnific-web-tools/
├── app/
│   ├── layout.tsx                 # Root layout with sidebar nav
│   ├── page.tsx                   # Redirect to /generate
│   ├── (auth)/
│   │   └── setup/
│   │       └── page.tsx           # API key configuration page
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   ├── generate/
│   │   │   └── page.tsx           # Image Generation
│   │   ├── upscale/
│   │   │   └── page.tsx           # AI Image Upscaler
│   │   ├── expand/
│   │   │   └── page.tsx           # AI Image Expand
│   │   ├── relight/
│   │   │   └── page.tsx           # AI Image Relight
│   │   ├── camera/
│   │   │   └── page.tsx           # Change Camera
│   │   ├── video/
│   │   │   └── page.tsx           # AI Video Generation
│   │   ├── motion/
│   │   │   └── page.tsx           # Motion Control Video
│   │   ├── prompt-tools/
│   │   │   └── page.tsx           # Image-to-Prompt & Improve Prompt
│   │   ├── icons/
│   │   │   └── page.tsx           # AI Icon Generation
│   │   ├── tasks/
│   │   │   └── page.tsx           # Task Queue / History
│   │   └── history/
│   │       └── page.tsx           # Result History Gallery
│   └── api/
│       └── magnific/
│           └── [...path]/
│               └── route.ts       # Catch-all API proxy
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx            # Navigation sidebar
│   │   ├── header.tsx             # Top header with rate display
│   │   └── mobile-nav.tsx         # Mobile hamburger menu
│   ├── shared/
│   │   ├── image-upload.tsx       # Reusable drag-and-drop upload
│   │   ├── image-preview.tsx      # Image preview with remove button
│   │   ├── image-comparison.tsx   # Before/after slider
│   │   ├── video-player.tsx       # Video playback component
│   │   ├── task-status.tsx        # Task polling status indicator
│   │   ├── download-button.tsx    # Download result button
│   │   ├── prompt-input.tsx       # Text prompt textarea
│   │   └── model-selector.tsx     # Model/tier dropdown
│   ├── generate/
│   │   └── generate-form.tsx      # Image generation form
│   ├── upscale/
│   │   └── upscale-form.tsx       # Upscaler form
│   ├── expand/
│   │   └── expand-form.tsx        # Expand/outpaint form
│   ├── relight/
│   │   └── relight-form.tsx       # Relight form
│   ├── camera/
│   │   └── camera-form.tsx        # Change camera form
│   ├── video/
│   │   └── video-form.tsx         # Video generation form
│   ├── motion/
│   │   ├── motion-form.tsx        # Motion control form
│   │   ├── motion-canvas.tsx      # Visual motion vector overlay
│   │   └── motion-presets.tsx     # Preset motion templates
│   ├── prompt-tools/
│   │   ├── image-to-prompt.tsx    # Image-to-prompt section
│   │   └── improve-prompt.tsx     # Improve prompt section
│   └── icons/
│       └── icon-form.tsx          # Icon generation form
├── lib/
│   ├── api-client.ts              # Fetch wrapper for /api/magnific
│   ├── task-poller.ts             # Polling logic with timeout
│   ├── constants.ts               # API endpoints, rate limits, defaults
│   ├── validators.ts              # Input validation helpers
│   └── utils.ts                   # General utilities
├── stores/
│   ├── auth-store.ts              # API key state (Zustand + persist)
│   ├── task-store.ts              # Task queue state (Zustand + persist)
│   ├── rate-limit-store.ts        # Rate limit counters (Zustand + persist)
│   └── history-store.ts           # Result history (Zustand + persist)
├── types/
│   ├── api.ts                     # Magnific API request/response types
│   ├── task.ts                    # Task status types
│   └── models.ts                  # Model configuration types
├── public/
│   └── ...                        # Static assets
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                     # (optional) default API key for dev
```

## Component Design

### API Proxy (Serverless Function)

```typescript
// app/api/magnific/[...path]/route.ts
// Single catch-all route that proxies all requests to Magnific API

// Flow:
// 1. Extract path segments from URL
// 2. Read API key from x-api-key header (sent by client from localStorage)
// 3. Forward request to https://api.magnific.com/v1/{path}
// 4. Add x-magnific-api-key header with the user's key
// 5. Stream response back to client
// 6. Handle errors (401, 429, 5xx) with appropriate status codes
```

### Task Poller

```typescript
// lib/task-poller.ts
// Client-side polling mechanism

interface PollOptions {
  taskId: string;
  endpoint: string;          // e.g., "/v1/ai/mystic"
  interval: number;          // 3000ms for images, 5000ms for video
  timeout: number;           // 120000ms for images, 600000ms for video
  onProgress: (status: TaskStatus) => void;
  onComplete: (result: TaskResult) => void;
  onError: (error: Error) => void;
}

// Uses AbortController for cleanup on unmount
// Stores active polls in task-store for persistence
```

### State Management (Zustand Stores)

```typescript
// stores/auth-store.ts
interface AuthStore {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isAuthenticated: () => boolean;
}

// stores/task-store.ts
interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (taskId: string, update: Partial<Task>) => void;
  getActiveTasks: () => Task[];
  getCompletedTasks: () => Task[];
}

// stores/rate-limit-store.ts
interface RateLimitStore {
  limits: Record<FeatureCategory, { max: number; remaining: number; resetAt: string }>;
  decrement: (category: FeatureCategory) => void;
  resetIfNewDay: () => void;
  isExhausted: (category: FeatureCategory) => boolean;
}

// stores/history-store.ts
interface HistoryStore {
  items: HistoryItem[];  // max 50
  addItem: (item: HistoryItem) => void;
  removeItem: (id: string) => void;
  getItems: () => HistoryItem[];
}
```

### Rate Limit Constants

```typescript
// lib/constants.ts
export const RATE_LIMITS = {
  'image-generation-classic': { max: 100, label: 'Classic Fast' },
  'image-generation-mystic': { max: 125, label: 'Mystic' },
  'image-generation-flux': { max: 100, label: 'Flux' },
  'image-expand': { max: 100, label: 'Image Expand' },
  'image-relight': { max: 125, label: 'Image Relight' },
  'image-upscaler': { max: 125, label: 'Image Upscaler' },
  'image-upscaler-precision': { max: 125, label: 'Upscaler Precision' },
  'change-camera': { max: 142, label: 'Change Camera' },
  'video-kling-standard': { max: 100, label: 'Kling V3 Standard' },
  'video-kling-pro': { max: 71, label: 'Kling V3 Pro' },
  'video-kling-mc': { max: 5, label: 'Kling Motion Control' },
  'icon-generation': { max: 25, label: 'Icon Generation' },
  'image-to-prompt': { max: 500, label: 'Image to Prompt' },
  'improve-prompt': { max: 125, label: 'Improve Prompt' },
} as const;
```

## API Endpoint Mapping

| Feature | Method | Magnific Endpoint |
|---------|--------|-------------------|
| Mystic Generate | POST | /v1/ai/mystic |
| Mystic Status | GET | /v1/ai/mystic/{task_id} |
| Flux Dev Generate | POST | /v1/ai/text-to-image/flux-dev |
| Flux Pro 1.1 Generate | POST | /v1/ai/text-to-image/flux-pro-v1-1 |
| Classic Fast Generate | POST | /v1/ai/text-to-image |
| Upscaler Creative | POST | /v1/ai/image-upscaler |
| Upscaler Precision | POST | /v1/ai/image-upscaler-precision |
| Image Expand | POST | /v1/ai/image-expand |
| Image Relight | POST | /v1/ai/image-relight |
| Change Camera | POST | /v1/ai/change-camera |
| Kling V3 Standard | POST | /v1/ai/video/kling-v3-standard |
| Kling V3 Pro | POST | /v1/ai/video/kling-v3-pro |
| Kling Motion Control | POST | /v1/ai/video/kling-motion |
| Image to Prompt | POST | /v1/ai/image-to-prompt |
| Improve Prompt | POST | /v1/ai/improve-prompt |
| Icon Generation | POST | /v1/ai/icon-generation |

## Security Considerations

1. **API Key Storage**: Stored in localStorage (client-side only). The key is sent to our API route via a custom header, never exposed in URLs or logs.
2. **API Proxy**: All Magnific API calls go through our serverless function — the API key is never sent directly from the browser to Magnific (prevents CORS issues and key exposure in network tab to third parties).
3. **Input Validation**: All user inputs validated client-side before submission. Server-side proxy validates content-type and file size.
4. **No Database**: Zero server-side state. No user data stored on our infrastructure.
5. **CORS**: API routes only accept requests from same origin.

## Deployment Configuration

### Vercel Settings
- **Framework**: Next.js (auto-detected)
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Node.js Version**: 20.x
- **Region**: Auto (closest to user)

### Environment Variables
```
# Optional: Default API key for demo mode
MAGNIFIC_DEFAULT_API_KEY=  (leave empty, users provide their own)
```

### Vercel Free Tier Limits (sufficient for this project)
- Bandwidth: 100 GB/month
- Serverless Function Execution: 100 GB-hours/month
- Function Duration: 60 seconds max
- Builds: 6000 minutes/month
- Deployments: Unlimited

## Performance Considerations

1. **Client-side polling** instead of server-side long-polling — reduces serverless function execution time
2. **Image previews** use `URL.createObjectURL()` — no server upload for preview
3. **Lazy loading** of feature pages via Next.js dynamic imports
4. **localStorage persistence** — no network calls for state recovery
5. **AbortController** on all fetch calls — clean cancellation on navigation

## Limitations & Trade-offs

1. **No real-time updates**: Polling-based, not WebSocket. Acceptable for this use case.
2. **No multi-user**: Each user manages their own API key. No shared accounts.
3. **History limited to URLs**: We store result URLs from Magnific. If Magnific expires URLs, history items become inaccessible.
4. **Rate limit tracking is approximate**: Client-side counter may drift if user uses API key elsewhere. Reset on page refresh or new day.
5. **File size limit**: 10MB upload limit per Vercel serverless function body size (free tier). Large images need client-side compression.
