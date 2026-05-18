export const API_BASE_URL = "/api/magnific";

export const MAGNIFIC_ENDPOINTS = {
  // Image Generation
  mystic: "/v1/ai/mystic",
  "flux-dev": "/v1/ai/text-to-image/flux-dev",
  "flux-pro-v1-1": "/v1/ai/text-to-image/flux-pro-v1-1",
  "classic-fast": "/v1/ai/text-to-image",

  // Image Editing
  "upscaler-creative": "/v1/ai/image-upscaler",
  "upscaler-precision": "/v1/ai/image-upscaler-precision",
  "image-expand": "/v1/ai/image-expand/flux-pro",
  "image-relight": "/v1/ai/image-relight",
  "change-camera": "/v1/ai/change-camera",

  // Video Generation
  "kling-v3-standard": "/v1/ai/video/kling-v3-standard",
  "kling-v3-pro": "/v1/ai/video/kling-v3-pro",
  "kling-standard": "/v1/ai/video/kling-standard",
  "kling-pro": "/v1/ai/video/kling-pro",
  "kling-advanced": "/v1/ai/video/kling-advanced",
  "kling-motion": "/v1/ai/video/kling-motion",

  // AI Tools
  "image-to-prompt": "/v1/ai/image-to-prompt",
  "improve-prompt": "/v1/ai/improve-prompt",
  "icon-generation": "/v1/ai/text-to-icon",
} as const;

export type EndpointKey = keyof typeof MAGNIFIC_ENDPOINTS;

export const RATE_LIMITS: Record<
  string,
  { max: number; label: string }
> = {
  "image-generation-classic": { max: 100, label: "Classic Fast" },
  "image-generation-mystic": { max: 125, label: "Mystic" },
  "image-generation-flux": { max: 100, label: "Flux" },
  "image-expand": { max: 100, label: "Image Expand" },
  "image-relight": { max: 125, label: "Image Relight" },
  "image-upscaler": { max: 125, label: "Image Upscaler" },
  "image-upscaler-precision": { max: 125, label: "Upscaler Precision" },
  "change-camera": { max: 142, label: "Change Camera" },
  "video-kling-v3-standard": { max: 100, label: "Kling V3 Standard" },
  "video-kling-v3-pro": { max: 71, label: "Kling V3 Pro" },
  "video-kling-standard": { max: 20, label: "Kling Standard" },
  "video-kling-pro": { max: 11, label: "Kling Pro" },
  "video-kling-advanced": { max: 5, label: "Kling Advanced" },
  "video-kling-mc": { max: 5, label: "Kling Motion Control" },
  "icon-generation": { max: 25, label: "Icon Generation" },
  "image-to-prompt": { max: 500, label: "Image to Prompt" },
  "improve-prompt": { max: 125, label: "Improve Prompt" },
};

export const POLL_INTERVALS = {
  image: 3000, // 3 seconds
  video: 5000, // 5 seconds
} as const;

export const POLL_TIMEOUTS = {
  image: 120000, // 2 minutes
  video: 600000, // 10 minutes
  prompt: 30000, // 30 seconds
} as const;

export const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  maxSizeRelight: 20 * 1024 * 1024, // 20MB for relight
  supportedFormats: ["image/jpeg", "image/png", "image/webp"],
  supportedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
} as const;

export const NAV_ITEMS = [
  {
    title: "Image Generation",
    href: "/generate",
    icon: "Image",
    description: "Generate images with AI models",
  },
  {
    title: "Image Upscaler",
    href: "/upscale",
    icon: "ZoomIn",
    description: "Enhance image resolution",
  },
  {
    title: "Image Expand",
    href: "/expand",
    icon: "Expand",
    description: "Extend image boundaries",
  },
  {
    title: "Image Relight",
    href: "/relight",
    icon: "Sun",
    description: "Change image lighting",
  },
  {
    title: "Video Generation",
    href: "/video",
    icon: "Video",
    description: "Image to Video AI",
  },
  {
    title: "Motion Control",
    href: "/motion",
    icon: "Move",
    description: "Video with motion control",
  },
  {
    title: "UGC Creator",
    href: "/ugc",
    icon: "Sparkles",
    description: "Professional UGC videos",
  },
  {
    title: "Product Photo",
    href: "/product",
    icon: "ShoppingBag",
    description: "Coming Soon",
    comingSoon: true,
  },
  {
    title: "Product Video",
    href: "/product-video",
    icon: "Package",
    description: "Video iklan produk profesional",
  },
  {
    title: "Task Queue",
    href: "/tasks",
    icon: "ListTodo",
    description: "Track active tasks",
  },
  {
    title: "Batch Upscaler",
    href: "/batch-upscale",
    icon: "Layers",
    description: "Upscale banyak gambar sekaligus",
  },
  {
    title: "Logo Animator",
    href: "/logo-animate",
    icon: "Clapperboard",
    description: "Animate logo jadi video intro",
  },
  {
    title: "Thumbnail",
    href: "/thumbnail",
    icon: "MonitorPlay",
    description: "Generate thumbnail YouTube",
  },
  {
    title: "History",
    href: "/history",
    icon: "History",
    description: "View past results",
  },
] as const;
