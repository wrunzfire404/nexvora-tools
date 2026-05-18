// Magnific API Request/Response Types

export interface MagnificTaskResponse {
  data: {
    task_id: string;
    status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  };
}

export interface MagnificTaskStatus {
  data: {
    task_id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
    result?: {
      url?: string;
      urls?: string[];
    };
    error?: string;
  };
}

// Image Generation
export interface MysticRequest {
  prompt: string;
  resolution?: string;
  creativity?: number;
  webhook_url?: string;
}

export interface FluxDevRequest {
  prompt: string;
  webhook_url?: string;
  aspect_ratio?: string;
  styling?: {
    effects?: {
      color?: string;
      framing?: string;
      lightning?: string;
    };
    colors?: Array<{ color: string; weight: number }>;
  };
  seed?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

export interface ClassicFastRequest {
  prompt: string;
  image?: {
    size: string;
  };
  webhook_url?: string;
}

// Image Editing
export interface UpscalerCreativeRequest {
  image: string; // base64 or URL
  prompt?: string;
  creativity?: number;
  webhook_url?: string;
}

export interface UpscalerPrecisionRequest {
  image: string;
  webhook_url?: string;
}

export interface ImageExpandRequest {
  image: string;
  prompt?: string;
  expand_top?: number;
  expand_bottom?: number;
  expand_left?: number;
  expand_right?: number;
  webhook_url?: string;
}

export interface ImageRelightRequest {
  image: string;
  prompt: string;
  webhook_url?: string;
}

export interface ChangeCameraRequest {
  image: string;
  rotation?: number;
  tilt?: number;
  pan?: number;
  zoom?: number;
  webhook_url?: string;
}

// Video Generation
export interface KlingVideoRequest {
  image?: string;
  prompt?: string;
  duration?: number;
  webhook_url?: string;
}

export interface KlingMotionRequest {
  image: string;
  prompt?: string;
  camera_pan?: number;
  camera_tilt?: number;
  camera_zoom?: number;
  camera_rotate?: number;
  subject_motion_direction?: number;
  subject_motion_speed?: number;
  duration?: number;
  webhook_url?: string;
}

// AI Tools
export interface ImageToPromptRequest {
  image: string;
}

export interface ImageToPromptResponse {
  data: {
    prompt: string;
  };
}

export interface ImprovePromptRequest {
  prompt: string;
}

export interface ImprovePromptResponse {
  data: {
    prompt: string;
  };
}

export interface IconGenerationRequest {
  prompt: string;
  style?: "flat" | "outlined" | "filled" | "gradient" | "hand-drawn";
  webhook_url?: string;
}
