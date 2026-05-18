# Requirements Document

## Introduction

Magnific Web Tools is a comprehensive web application that provides a user-friendly interface to access Magnific API's free tier features. The application covers image generation, AI editing, video generation (including motion control), AI tools, and stock content — going beyond single-feature tools like sakenmotion.vercel.app by offering a unified dashboard for all available free-tier API capabilities. The application will be deployed on Vercel's free tier and built with a modern React-based stack.

## Glossary

- **Web_App**: The Magnific Web Tools frontend application deployed on Vercel
- **API_Client**: The server-side module that communicates with the Magnific API (https://api.magnific.com)
- **Task_Poller**: The component responsible for polling async task status until completion
- **Image_Generator**: The module handling image generation requests (Mystic, Flux, Classic Fast)
- **Image_Editor**: The module handling AI image editing operations (Expand, Relight, Upscale, Change Camera)
- **Video_Generator**: The module handling AI video generation requests (Kling variants)
- **Motion_Controller**: The module handling Kling V3 Motion Control video generation with camera/subject motion parameters
- **Prompt_Tools**: The module handling Image-to-Prompt and Improve Prompt operations
- **Icon_Generator**: The module handling AI icon generation and preview
- **Gallery**: The component that displays generated/edited media results
- **API_Key_Manager**: The component that securely stores and manages the user's Magnific API key
- **Rate_Display**: The component showing remaining daily quota for each feature

## Requirements

### Requirement 1: API Key Configuration

**User Story:** As a user, I want to securely configure my Magnific API key, so that I can authenticate requests to the Magnific API.

#### Acceptance Criteria

1. WHEN the user opens the Web_App for the first time, THE API_Key_Manager SHALL prompt the user to enter a Magnific API key that is a non-empty string with a maximum length of 256 characters
2. WHEN the user submits an API key, THE API_Key_Manager SHALL store the key in the browser's localStorage
3. IF the user navigates to any feature page without a configured API key in localStorage, THEN THE Web_App SHALL redirect the user to the API key configuration page
4. WHEN the user requests to remove the stored API key, THE API_Key_Manager SHALL delete the key from localStorage and redirect to the configuration page
5. THE API_Client SHALL include the stored API key in the `x-magnific-api-key` header for all API requests
6. IF an API request receives an authentication error response from the Magnific API, THEN THE Web_App SHALL display an error message indicating the API key is invalid or expired and redirect the user to the API key configuration page within 3 seconds
7. IF no API key is found in localStorage when the API_Client attempts to send a request, THEN THE API_Client SHALL cancel the request and THE Web_App SHALL redirect the user to the API key configuration page

### Requirement 2: Image Generation

**User Story:** As a user, I want to generate images using multiple AI models, so that I can create visual content with different styles and quality levels.

#### Acceptance Criteria

1. THE Image_Generator SHALL provide model selection for Mystic, Flux Dev, Flux Pro 1.1, and Classic Fast
2. WHEN the user submits a text prompt of 1 to 2000 characters and selects a model, THE Image_Generator SHALL send a generation request to the corresponding Magnific API endpoint
3. WHEN the API returns a task_id, THE Task_Poller SHALL poll the task status endpoint every 3 seconds for a maximum of 120 seconds until the status is COMPLETED or FAILED
4. WHEN the task status is COMPLETED, THE Gallery SHALL display the generated image with download capability
5. IF the task status is FAILED, THEN THE Web_App SHALL display the error message returned by the API
6. IF the Task_Poller reaches the 120-second timeout without receiving COMPLETED or FAILED status, THEN THE Web_App SHALL stop polling and display an error message indicating the generation timed out
7. THE Image_Generator SHALL allow the user to configure image dimensions with width between 256 and 1920 pixels and height between 256 and 1920 pixels, in increments of 8 pixels
8. WHEN using the Mystic model, THE Image_Generator SHALL allow the user to set a creativity level parameter as a numeric value between 0 and 1 inclusive
9. WHEN using Flux models, THE Image_Generator SHALL allow the user to set guidance scale as a numeric value between 1 and 20 inclusive and number of inference steps as an integer between 1 and 50 inclusive

### Requirement 3: AI Image Upscaler

**User Story:** As a user, I want to upscale images using AI, so that I can enhance low-resolution images to higher quality.

#### Acceptance Criteria

1. THE Image_Editor SHALL provide two upscaling modes: Creative Upscaler and Precision Upscaler (v1 and v2)
2. WHEN the user uploads an image and selects an upscaling mode, THE Image_Editor SHALL send the image to the corresponding upscaler endpoint
3. WHEN using Creative Upscaler, THE Image_Editor SHALL allow the user to set a creativity level between 1 and 5 (inclusive) and an optional text prompt of up to 1000 characters to guide the upscaling
4. WHEN using Precision Upscaler, THE Image_Editor SHALL allow the user to select between v1 and v2 variants
5. WHEN the upscaling task is COMPLETED, THE Gallery SHALL display the upscaled image alongside the original for comparison
6. THE Image_Editor SHALL accept image uploads in JPEG, PNG, and WebP formats and SHALL reject files in any other format with a validation error indicating the supported formats
7. IF the uploaded image exceeds 10 MB in file size, THEN THE Image_Editor SHALL display a validation error indicating the maximum allowed size before sending the request
8. IF the upscaling API returns an error or fails to respond within 60 seconds, THEN THE Image_Editor SHALL display an error message indicating the failure reason and SHALL preserve the original uploaded image for retry

### Requirement 4: AI Image Expand (Outpainting)

**User Story:** As a user, I want to expand images beyond their original boundaries, so that I can extend compositions and add context to cropped images.

#### Acceptance Criteria

1. WHEN the user uploads an image, THE Image_Editor SHALL display a canvas showing the original image with selectable expansion directions (top, bottom, left, right), where at least one direction must be selected before submission
2. THE Image_Editor SHALL allow the user to specify expansion size in pixels for each selected direction, with a minimum of 1 pixel and a maximum of 1024 pixels per direction
3. WHEN the user submits an expand request, THE Image_Editor SHALL send the image, selected expansion directions, pixel sizes, and optional text prompt to the AI Image Expand endpoint
4. WHEN the expand task is completed, THE Gallery SHALL display the expanded image with download capability
5. THE Image_Editor SHALL allow the user to provide an optional text prompt of up to 500 characters to guide the content of expanded areas
6. IF the expand task fails or times out after 120 seconds, THEN THE Image_Editor SHALL display an error message indicating the failure reason and allow the user to retry the request with the same parameters

### Requirement 5: AI Image Relight

**User Story:** As a user, I want to change the lighting of images using AI, so that I can adjust mood and atmosphere without manual editing.

#### Acceptance Criteria

1. WHEN the user uploads an image in a supported format (JPEG, PNG, or WebP) with a file size of 20 MB or less, THE Image_Editor SHALL display the image with lighting adjustment controls including a text prompt input field
2. THE Image_Editor SHALL allow the user to provide a text prompt describing the desired lighting conditions with a maximum length of 500 characters
3. WHEN the user submits a relight request, THE Image_Editor SHALL send the image and the text prompt to the AI Image Relight endpoint and display a progress indicator until processing completes or times out after 120 seconds
4. WHEN the relight task is completed, THE Gallery SHALL display the relit image alongside the original for side-by-side comparison
5. IF the relight task fails or exceeds the 120-second timeout, THEN THE Image_Editor SHALL display an error message indicating the failure reason and allow the user to retry the request without re-uploading the image
6. IF the user uploads a file that is not in a supported format or exceeds 20 MB, THEN THE Image_Editor SHALL reject the upload and display an error message indicating the accepted formats and maximum file size

### Requirement 6: Change Camera

**User Story:** As a user, I want to change the camera angle or perspective of images, so that I can simulate different viewpoints of a scene.

#### Acceptance Criteria

1. WHEN the user uploads an image, THE Image_Editor SHALL display camera angle adjustment controls including rotation angle, vertical tilt, horizontal pan, and zoom level
2. THE Image_Editor SHALL allow the user to specify camera transformation parameters within the following ranges: rotation angle from -180 to +180 degrees, vertical tilt from -90 to +90 degrees, horizontal pan from -90 to +90 degrees, and zoom level from 0.5x to 3.0x
3. WHEN the user submits a camera change request with all parameters within valid ranges, THE Image_Editor SHALL send the image and camera parameters to the Change Camera endpoint and display a processing indicator within 1 second
4. WHEN the camera change task is completed, THE Gallery SHALL display the transformed image alongside the original for comparison
5. IF the user submits camera parameters outside the valid ranges, THEN THE Image_Editor SHALL prevent submission and display an error message indicating which parameter is out of range
6. IF the Change Camera endpoint fails to return a result within 60 seconds or returns an error, THEN THE Image_Editor SHALL display an error message indicating the transformation could not be completed and allow the user to retry with the same parameters

### Requirement 7: AI Video Generation

**User Story:** As a user, I want to generate AI videos from images or text, so that I can create animated content from static inputs.

#### Acceptance Criteria

1. THE Video_Generator SHALL provide model tier selection: V3 Standard, V3 Pro, Standard, Pro, and Advanced
2. WHEN the user provides an input image (JPEG or PNG, maximum 10 MB) and optional text prompt (maximum 500 characters), THE Video_Generator SHALL send a video generation request to the selected Kling endpoint
3. WHEN the API returns a task_id, THE Task_Poller SHALL poll the task status endpoint every 5 seconds until the status is COMPLETED or FAILED, up to a maximum polling duration of 10 minutes
4. WHEN the video generation task is COMPLETED, THE Gallery SHALL display the generated video with playback controls (play, pause, seek, and volume) and a download button
5. THE Video_Generator SHALL allow the user to configure video duration by selecting either 5 seconds or 10 seconds
6. THE Video_Generator SHALL display estimated generation time based on the selected model tier before the user submits the request
7. IF the video generation task status is FAILED, THEN THE Web_App SHALL display an error message indicating the failure reason returned by the API and suggest the user try a lower tier model
8. IF the Task_Poller reaches the maximum polling duration without receiving a COMPLETED or FAILED status, THEN THE Web_App SHALL stop polling and display an error message indicating the generation timed out
9. WHEN the user provides a text prompt without an input image, THE Video_Generator SHALL send a text-to-video generation request to the selected Kling endpoint

### Requirement 8: AI Motion Control Video

**User Story:** As a user, I want to generate videos with precise camera and subject motion control, so that I can create cinematic animations with specific movement directions.

#### Acceptance Criteria

1. THE Motion_Controller SHALL provide model selection for Kling V3 MC Pro and V3 MC Standard, with V3 MC Pro selected by default
2. WHEN the user uploads a reference image, THE Motion_Controller SHALL validate that the image is in JPEG or PNG format and does not exceed 10 MB in file size, and upon successful validation SHALL display the image with motion control overlay tools including camera motion sliders and a subject motion vector handle
3. IF the uploaded image fails format or size validation, THEN THE Motion_Controller SHALL display an error message indicating the accepted formats and maximum file size, and SHALL NOT proceed to the motion control interface
4. THE Motion_Controller SHALL allow the user to define camera motion parameters including pan (left/right), tilt (up/down), zoom (in/out), and rotate, each adjustable on a scale from -10 to +10 in integer increments
5. THE Motion_Controller SHALL allow the user to define subject motion direction using a visual arrow or vector control on the image, supporting 360 degrees of direction
6. WHEN the user submits a motion control request, THE Motion_Controller SHALL send the image, motion parameters, and optional text prompt (maximum 2500 characters) to the Kling V3 Motion Control endpoint
7. WHEN the API returns a task_id, THE Task_Poller SHALL poll the task status endpoint every 5 seconds until the status is COMPLETED or FAILED, up to a maximum polling duration of 10 minutes
8. IF the polling duration exceeds 10 minutes without reaching COMPLETED or FAILED status, THEN THE Task_Poller SHALL stop polling and THE Motion_Controller SHALL display an error message indicating a timeout occurred
9. WHEN the motion control task is COMPLETED, THE Gallery SHALL display the generated video with play, pause, seek, and download controls
10. IF the motion control task status is FAILED, THEN THE Motion_Controller SHALL display an error message indicating the generation failed and SHALL allow the user to retry with the same parameters
11. THE Motion_Controller SHALL provide at least 5 preset motion templates for quick selection, including zoom in, zoom out, pan left, pan right, and orbit
12. THE Motion_Controller SHALL allow the user to combine up to 4 motion types in a single generation request

### Requirement 9: Image to Prompt

**User Story:** As a user, I want to extract text prompts from existing images, so that I can understand or replicate the style and content of reference images.

#### Acceptance Criteria

1. WHEN the user uploads an image in PNG, JPEG, or WebP format with a file size not exceeding 10 MB, THE Prompt_Tools SHALL send the image to the Image-to-Prompt endpoint and display a loading indicator until the response is received
2. WHEN the response is received from the Image-to-Prompt endpoint within 30 seconds, THE Prompt_Tools SHALL display the generated text prompt in a copyable text field
3. WHEN the user activates the "Use in Image Generator" button, THE Prompt_Tools SHALL navigate to the Image Generator view with the generated prompt pre-filled in the prompt input field
4. IF the Image-to-Prompt endpoint fails to respond within 30 seconds or returns an error, THEN THE Prompt_Tools SHALL display an error message indicating the prompt could not be generated and allow the user to retry the operation
5. IF the user uploads a file that is not in PNG, JPEG, or WebP format or exceeds 10 MB, THEN THE Prompt_Tools SHALL reject the upload and display a message indicating the supported formats and maximum file size

### Requirement 10: Improve Prompt

**User Story:** As a user, I want to enhance my text prompts, so that I can get better results from image generation models.

#### Acceptance Criteria

1. WHEN the user enters a text prompt of 1 to 10,000 characters and submits it for improvement, THE Prompt_Tools SHALL send the prompt to the Improve Prompt endpoint and display a loading indicator until the response is received or 30 seconds have elapsed
2. WHEN the improved prompt response is received within 30 seconds, THE Prompt_Tools SHALL display the improved prompt alongside the original prompt, with both prompts fully visible and distinguishable
3. THE Prompt_Tools SHALL provide a button to directly use the improved prompt in the Image Generator
4. THE Prompt_Tools SHALL allow the user to iterate by improving the already-improved prompt, up to a maximum of 10 consecutive iterations per original prompt
5. IF the Improve Prompt endpoint fails to respond within 30 seconds or returns an error, THEN THE Prompt_Tools SHALL display an error message indicating the improvement failed and retain the user's original prompt text
6. IF the user submits a prompt that is empty or exceeds 10,000 characters, THEN THE Prompt_Tools SHALL display a validation message indicating the allowed length range and SHALL NOT send the request to the endpoint

### Requirement 11: AI Icon Generation

**User Story:** As a user, I want to generate custom icons using AI, so that I can create unique icons for applications and designs.

#### Acceptance Criteria

1. WHEN the user provides a text description of the desired icon between 1 and 500 characters in length, THE Icon_Generator SHALL send the request to the AI Icon Generation endpoint
2. THE Icon_Generator SHALL allow the user to specify icon style preferences from the following options: flat, outlined, filled, gradient, and hand-drawn
3. WHEN the icon generation task is completed, THE Gallery SHALL display the generated icon at its full resolution and provide download capability in PNG, SVG, and ICO formats
4. WHEN the user selects the preview option, THE Icon_Generator SHALL generate a 64×64 pixel preview within 5 seconds before the user commits to full 512×512 pixel generation
5. IF the text description is empty or exceeds 500 characters, THEN THE Icon_Generator SHALL reject the request and display an error message indicating the allowed description length
6. IF the AI Icon Generation endpoint fails to respond within 30 seconds or returns an error, THEN THE Icon_Generator SHALL display an error message indicating that generation was unsuccessful and allow the user to retry the request
7. IF no icon style preference is specified by the user, THEN THE Icon_Generator SHALL default to the flat style

### Requirement 12: Async Task Management

**User Story:** As a user, I want to track the progress of all my generation tasks, so that I can manage multiple concurrent operations.

#### Acceptance Criteria

1. THE Web_App SHALL maintain a task queue displaying all active tasks and the most recent 50 completed or failed tasks with their current status (PENDING, PROCESSING, COMPLETED, or FAILED)
2. WHEN a new task is submitted, THE Task_Poller SHALL add the task to the queue with status PENDING
3. WHILE a task is in PROCESSING state, THE Task_Poller SHALL poll for status updates at an interval no greater than 5 seconds and display an indeterminate progress indicator for that task
4. WHEN a task transitions to COMPLETED state, THE Web_App SHALL display a non-blocking visual notification that remains visible for at least 5 seconds or until the user dismisses it
5. THE Web_App SHALL allow the user to view results of completed tasks from the task queue
6. THE Web_App SHALL persist the task history in localStorage, retaining a maximum of 100 task records, so that tasks survive page refreshes
7. IF a task transitions to FAILED state, THEN THE Web_App SHALL display the task in the queue with a FAILED status and an error message indicating the reason for failure
8. IF localStorage write fails due to quota exceeded, THEN THE Web_App SHALL remove the oldest completed task records to free space and retry the write
9. WHILE a task is in PENDING or PROCESSING state and no status update has been received for 120 seconds, THE Task_Poller SHALL mark the task as FAILED with an indication of a timeout

### Requirement 13: Rate Limit Display

**User Story:** As a user, I want to see my remaining daily API quota, so that I can plan my usage within free tier limits.

#### Acceptance Criteria

1. THE Rate_Display SHALL show the daily quota limit as a numeric total and the remaining request count for each feature category
2. WHEN an API request is made, THE Rate_Display SHALL decrement the remaining count for the corresponding feature category within 2 seconds of the response being received
3. IF the remaining quota for a feature category reaches zero, THEN THE Rate_Display SHALL display a visible text warning indicating the quota is exhausted and disable the submit button for that feature category
4. WHEN a new day begins (UTC midnight), THE Rate_Display SHALL reset all quota counters to their daily maximum values
5. IF the quota data cannot be retrieved, THEN THE Rate_Display SHALL display a message indicating that quota information is unavailable and retain the last known quota values

### Requirement 14: Responsive Layout and Navigation

**User Story:** As a user, I want to navigate between features easily on any device, so that I can use the tool on desktop and mobile.

#### Acceptance Criteria

1. THE Web_App SHALL provide a sidebar navigation menu listing all feature categories: Image Generation, Image Editing, Video Generation, Motion Control, Prompt Tools, and Icon Generation
2. WHILE the viewport width is less than 768 pixels, THE Web_App SHALL collapse the sidebar into a hamburger menu icon that, when tapped, opens an overlay navigation panel listing all feature categories, and when tapped again or when a category is selected, closes the overlay
3. THE Web_App SHALL maintain the user's current feature category selection across page refreshes by encoding the selected category in the URL path
4. THE Web_App SHALL render all feature interfaces without horizontal scrolling and without content overflow or truncation at viewport widths between 320 pixels and 1920 pixels
5. IF the user navigates to a URL path that does not correspond to a valid feature category, THEN THE Web_App SHALL redirect the user to the first feature category (Image Generation) and update the URL accordingly
6. WHILE the viewport width is less than 768 pixels, THE Web_App SHALL render all interactive navigation elements with a minimum touch target size of 44 by 44 CSS pixels

### Requirement 15: Image Upload and Preview

**User Story:** As a user, I want a consistent image upload experience across all features, so that I can easily provide input images.

#### Acceptance Criteria

1. THE Web_App SHALL provide a drag-and-drop upload zone for all features requiring image input
2. THE Web_App SHALL also provide a file picker button as an alternative to drag-and-drop
3. WHEN an image is uploaded, THE Web_App SHALL display a scaled-to-fit preview of the uploaded image within 2 seconds, and SHALL provide a control to remove the selected image before submission
4. IF the uploaded file is not one of the supported formats (JPEG, PNG, WebP), THEN THE Web_App SHALL display an inline error message indicating the unsupported format and SHALL not retain the file
5. IF the uploaded file size exceeds 10MB, THEN THE Web_App SHALL display an inline error message indicating the size limit and SHALL not retain the file
6. IF multiple files are dropped or selected at once, THEN THE Web_App SHALL accept only the first file and discard the rest
7. IF the uploaded file has a supported extension but cannot be decoded as a valid image, THEN THE Web_App SHALL display an inline error message indicating the file is not a valid image and SHALL not retain the file

### Requirement 16: Result Download and History

**User Story:** As a user, I want to download generated results and view my history, so that I can save and revisit my creations.

#### Acceptance Criteria

1. WHEN a generation task is COMPLETED, THE Gallery SHALL provide a download button that saves the result (image or video) to the user's device with a filename containing the task type and timestamp
2. THE Web_App SHALL maintain a history of the 50 most recent completed results in localStorage, evicting the oldest entry when the limit is exceeded
3. THE Web_App SHALL provide a History page displaying thumbnails of past results with timestamps and task type labels
4. WHEN the user clicks a history item, THE Web_App SHALL display the full result with its original parameters
5. IF a history item's result URL is no longer accessible, THEN THE Web_App SHALL display a placeholder indicating the result has expired and allow the user to remove the entry
6. IF localStorage write fails due to quota exceeded, THEN THE Web_App SHALL remove the oldest history entries until the write succeeds

### Requirement 17: Error Handling and Retry

**User Story:** As a user, I want clear error messages and retry options, so that I can recover from failures without losing my input.

#### Acceptance Criteria

1. IF the API returns a network error (timeout after 30 seconds or connection failure), THEN THE Web_App SHALL display an error message indicating the connection problem and provide a retry button
2. IF the API returns a 401 Unauthorized response, THEN THE Web_App SHALL prompt the user to verify or re-enter the API key via an inline input field displayed in the error area
3. IF the API returns a 429 Too Many Requests response, THEN THE Web_App SHALL display a rate limit exceeded message and, if the response includes a retry-after value, display the remaining wait time in seconds; otherwise display a message indicating the user should wait before retrying
4. WHEN a retry is triggered, THE Web_App SHALL resubmit the original request with the same parameters, waiting at least 2 seconds between consecutive retry attempts, up to a maximum of 3 retry attempts
5. THE Web_App SHALL preserve all user input (prompts, settings, uploaded images) during error states until the user explicitly navigates away or clears the form
6. IF the maximum retry attempts (3) are exhausted without a successful response, THEN THE Web_App SHALL disable the retry button, display an error message indicating that the request could not be completed, and retain the user's input for manual resubmission
7. IF the API returns a 5xx server error response, THEN THE Web_App SHALL display an error message indicating a server-side issue and provide a retry button
