import type { AxiosError, AxiosInstance } from "axios";

// A sleeping backend or its proxy may fail the first request. Retry reads only.
export function installCatalogRetry(client: AxiosInstance) {
 return client.interceptors.response.use(response => response, async (error: AxiosError) => {
  const config = error.config as typeof error.config & { _catalogRetries?: number };
  const temporary = error.response
   ? [408, 502, 503, 504].includes(error.response.status)
   : ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT", "ECONNRESET"].includes(error.code || "");
  if (!config || config.method?.toLowerCase() !== "get" || !(config.url === "/catalog" || /^\/products(?:\/[^?]*)?(?:\?|$)/.test(config.url || "")) || config.signal?.aborted || error.code === "ERR_CANCELED" || !temporary || (config._catalogRetries || 0) >= 2) throw error;
  config._catalogRetries = (config._catalogRetries || 0) + 1;
  await new Promise<void>(resolve => setTimeout(resolve, config._catalogRetries! * 1000));
  if (config.signal?.aborted) throw error;
  return client(config);
 });
}
