# Magnific Web Tools

A comprehensive web application for accessing Magnific API's free tier features — image generation, AI editing, video generation, motion control, and more.

## Features

- **Image Generation** — Mystic, Flux Dev, Flux Pro 1.1, Classic Fast
- **AI Image Upscaler** — Creative & Precision modes
- **AI Image Expand** — Outpainting with directional control
- **AI Image Relight** — Change lighting with text prompts
- **Change Camera** — Adjust perspective and angle
- **AI Video Generation** — Kling V3 Standard/Pro/Advanced
- **Motion Control Video** — Camera motion with presets
- **Prompt Tools** — Image-to-Prompt & Improve Prompt
- **AI Icon Generation** — Custom icons with style options
- **Task Queue** — Track all active/completed tasks
- **History** — Browse past results

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Magnific API key (free at https://www.freepik.com/api/pricing)

### Installation

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and enter your API key.

### Deploy to Vercel

```bash
# Push to GitHub, then:
# 1. Go to vercel.com
# 2. Import your repository
# 3. Deploy (zero config needed)
```

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark theme)
- **Zustand** (state management + localStorage persistence)
- **react-dropzone** (file upload)
- **Lucide React** (icons)

## Architecture

```
Browser → Vercel API Route (proxy) → Magnific API
```

- API key stored in localStorage (client-side only)
- All API calls proxied through `/api/magnific/[...path]`
- Client-side polling for async task status
- Zero database — all state in browser

## Free Tier Limits (per day)

| Feature | Limit |
|---------|-------|
| Mystic | 125 |
| Flux | 100 |
| Classic Fast | 100 |
| Image Upscaler | 125 |
| Image Expand | 100 |
| Image Relight | 125 |
| Change Camera | 142 |
| Kling V3 Standard | 100 |
| Kling V3 Pro | 71 |
| Motion Control | 5 |
| Icon Generation | 25 |
| Image to Prompt | 500 |
| Improve Prompt | 125 |
