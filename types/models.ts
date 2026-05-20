export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  rateKey: string;
  maxPerDay: number;
  pollInterval: number;
  pollTimeout: number;
  supports?: {
    creativity?: boolean;
    guidanceScale?: boolean;
    inferenceSteps?: boolean;
    aspectRatio?: boolean;
    dimensions?: boolean;
  };
}

export const IMAGE_MODELS: ModelConfig[] = [
  {
    id: "flux-dev",
    name: "Flux Dev",
    description: "High quality, detailed images with fine control",
    endpoint: "/v1/ai/text-to-image/flux-dev",
    rateKey: "image-generation-flux",
    maxPerDay: 100,
    pollInterval: 3000,
    pollTimeout: 120000,
    supports: { guidanceScale: true, inferenceSteps: true },
  },
  {
    id: "flux-pro-v1-1",
    name: "Flux Pro 1.1",
    description: "Premium quality generation",
    endpoint: "/v1/ai/text-to-image/flux-pro-v1-1",
    rateKey: "image-generation-flux",
    maxPerDay: 100,
    pollInterval: 3000,
    pollTimeout: 120000,
    supports: { guidanceScale: true, inferenceSteps: true },
  },
  {
    id: "classic-fast",
    name: "Classic Fast",
    description: "Quick generation for rapid iterations",
    endpoint: "/v1/ai/text-to-image",
    rateKey: "image-generation-classic",
    maxPerDay: 100,
    pollInterval: 3000,
    pollTimeout: 120000,
    supports: { dimensions: true },
  },
];

export const VIDEO_MODELS: ModelConfig[] = [
  {
    id: "kling-v3-standard",
    name: "Kling V3 Standard",
    description: "High quota, good quality video generation",
    endpoint: "/v1/ai/video/kling-v3-standard",
    rateKey: "video-kling-v3-standard",
    maxPerDay: 100,
    pollInterval: 5000,
    pollTimeout: 600000,
  },
  {
    id: "kling-v3-pro",
    name: "Kling V3 Pro",
    description: "Higher quality with more detail",
    endpoint: "/v1/ai/video/kling-v3-pro",
    rateKey: "video-kling-v3-pro",
    maxPerDay: 71,
    pollInterval: 5000,
    pollTimeout: 600000,
  },
  {
    id: "kling-standard",
    name: "Kling Standard (v1.6/v2.1)",
    description: "Standard quality video",
    endpoint: "/v1/ai/video/kling-standard",
    rateKey: "video-kling-standard",
    maxPerDay: 20,
    pollInterval: 5000,
    pollTimeout: 600000,
  },
  {
    id: "kling-pro",
    name: "Kling Pro (v1.6/v2.1/v2.5/v2.6)",
    description: "Professional quality video",
    endpoint: "/v1/ai/video/kling-pro",
    rateKey: "video-kling-pro",
    maxPerDay: 11,
    pollInterval: 5000,
    pollTimeout: 600000,
  },
  {
    id: "kling-advanced",
    name: "Kling Advanced",
    description: "Best quality, limited quota",
    endpoint: "/v1/ai/video/kling-advanced",
    rateKey: "video-kling-advanced",
    maxPerDay: 5,
    pollInterval: 5000,
    pollTimeout: 600000,
  },
];

export const MOTION_MODELS: ModelConfig[] = [
  {
    id: "kling-mc-pro",
    name: "Kling V3 MC Pro",
    description: "Motion control with higher quality",
    endpoint: "/v1/ai/video/kling-motion",
    rateKey: "video-kling-mc",
    maxPerDay: 5,
    pollInterval: 5000,
    pollTimeout: 600000,
  },
  {
    id: "kling-mc-standard",
    name: "Kling V3 MC Standard",
    description: "Motion control standard quality",
    endpoint: "/v1/ai/video/kling-motion",
    rateKey: "video-kling-mc",
    maxPerDay: 5,
    pollInterval: 5000,
    pollTimeout: 600000,
  },
];

export interface MotionPreset {
  id: string;
  name: string;
  icon: string;
  pan: number;
  tilt: number;
  zoom: number;
  rotate: number;
}

export const MOTION_PRESETS: MotionPreset[] = [
  { id: "zoom-in", name: "Zoom In", icon: "ZoomIn", pan: 0, tilt: 0, zoom: 5, rotate: 0 },
  { id: "zoom-out", name: "Zoom Out", icon: "ZoomOut", pan: 0, tilt: 0, zoom: -5, rotate: 0 },
  { id: "pan-left", name: "Pan Left", icon: "ArrowLeft", pan: -5, tilt: 0, zoom: 0, rotate: 0 },
  { id: "pan-right", name: "Pan Right", icon: "ArrowRight", pan: 5, tilt: 0, zoom: 0, rotate: 0 },
  { id: "orbit", name: "Orbit", icon: "RotateCw", pan: 3, tilt: 2, zoom: 0, rotate: 3 },
  { id: "tilt-up", name: "Tilt Up", icon: "ArrowUp", pan: 0, tilt: -5, zoom: 0, rotate: 0 },
  { id: "tilt-down", name: "Tilt Down", icon: "ArrowDown", pan: 0, tilt: 5, zoom: 0, rotate: 0 },
  { id: "dolly-zoom", name: "Dolly Zoom", icon: "Focus", pan: 0, tilt: 0, zoom: 7, rotate: 0 },
];
