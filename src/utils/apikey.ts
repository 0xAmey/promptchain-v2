export function isValidOpenAiAPIKey(apiKey: string | null) {
  return apiKey?.length == 51 && apiKey?.startsWith("sk-");
}

export function isValidHuggingFaceAPIKey(apiKey: string | null) {
  return apiKey?.length == 73 && apiKey?.startsWith("sk-or");
}
