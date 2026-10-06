const WRAPPER_TAG = /<\/?\s*(source_cv|target_role|answer|current_value|question)\b[^>]*>/gi;

// Keeps user text from closing the tags that wrap it in a prompt.
export function stripWrapperTags(value: string): string {
  return value.replace(WRAPPER_TAG, '');
}
