/** Request to the mock server */
export interface SpyRequest {
  /** Route ID */
  routeId: string;
  /** Request URL */
  url: string;
  /** Request method */
  method: string;
  /** Request headers */
  headers: Record<string, string | string[] | undefined>;
  /** Request body */
  body?: Record<string, unknown>;
  /** Request query params */
  params?: Record<string, string>;
}
