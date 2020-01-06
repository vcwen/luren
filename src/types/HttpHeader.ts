export default interface IHttpHeader {
  // Authentication
  'WWW-Authenticate'?: string
  Authorization?: string
  'Proxy-Authenticate'?: string
  'Proxy-Authorization'?: string

  // Caching
  Age?: string
  'Cache-Control'?: string
  'Clear-Site-Data'?: string
  Expires?: string
  Pragma?: string
  Warning?: string

  // Conditionals
  'Last-Modified'?: string
  ETag?: string
  'If-Match'?: string
  'If-None-Match'?: string
  'If-Modified-Since'?: string
  'If-Unmodified-Since'?: string
  Vary?: string

  // Connection management
  Connection?: string
  'Keep-Alive'?: string

  // Content negotiation
  Accept?: string
  'Accept-Charset'?: string
  'Accept-Encoding'?: string
  'Accept-Language'?: string

  // Controls
  Expect?: string

  // Cookies
  Cookie?: string
  'Set-Cookie'?: string

  // CORS
  'Access-Control-Allow-Origin'?: string
  'Access-Control-Allow-Credentials'?: string
  'Access-Control-Allow-Headers'?: string
  'Access-Control-Allow-Methods'?: string
  'Access-Control-Expose-Headers'?: string
  'Access-Control-Max-Age'?: string
  'Access-Control-Request-Headers'?: string
  'Access-Control-Request-Method'?: string
  Origin?: string
  'Timing-Allow-Origin'?: string

  // Do Not Track
  DNT?: string
  Tk?: string

  // Downloads
  'Content-Disposition'?: string

  // Message body information
  'Content-Length'?: number
  'Content-Type'?: string
  'Content-Encoding'?: string
  'Content-Language'?: string
  'Content-Location'?: string

  // Proxies
  Forwarded?: string
  Via?: string

  // Redirects
  Location?: string

  // Request context
  From?: string
  Host?: string
  Referer?: string
  'Referrer-Policy'?: string
  'User-Agent'?: string

  // Response context
  Allow?: string
  Server?: string

  // Range requests
  'Accept-Ranges'?: string
  Range?: string
  'If-Range'?: string
  'Content-Range'?: string

  // Security
  'Cross-Origin-Opener-Policy'?: string
  'Cross-Origin-Resource-Policy'?: string
  'Content-Security-Policy'?: string
  'Content-Security-Policy-Report-Only'?: string
  'Expect-CT'?: string
  'Feature-Policy'?: string
  'Public-Key-Pins'?: string
  'Public-Key-Pins-Report-Only'?: string
  'Strict-Transport-Security'?: string
  'Upgrade-Insecure-Requests'?: string
  'X-Content-Type-Options'?: string
  'X-Frame-Options'?: string
  'X-Powered-By'?: string
  'X-XSS-Protection'?: string

  // Transfer coding
  'Transfer-Encoding'?: string
  TE?: string
  Trailer?: string

  // WebSockets
  'Sec-WebSocket-Accept'?: string

  // Other
  'Alt-Svc'?: string
  Date?: string
  'Large-Allocation'?: string
  Link?: string
  'Retry-After'?: string
  'Server-Timing'?: string
  SourceMap?: string
  'X-DNS-Prefetch-Control'?: string
  [key: string]: any
}
