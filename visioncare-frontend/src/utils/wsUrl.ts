/**
 * Helper to get the correct WebSocket base URL in both local and deployed environments.
 * Converts http:// -> ws:// and https:// -> wss://
 */
export const getWebSocketBaseUrl = (): string => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
  return apiUrl.replace(/^http/, "ws");
};
