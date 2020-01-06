export enum HttpHeader {
  // Authentication
  WWW_Authenticate = 'WWW-Authenticate',
  Authorization = 'Authorization',
  Proxy_Authenticate = 'Proxy-Authenticate',
  Proxy_Authorization = 'Proxy-Authorization',

  // Caching
  Age = 'Age',
  Cache_Control = 'Cache-Control',
  Clear_Site_Data = 'Clear-Site-Data',
  Expires = 'Expires',
  Pragma = 'Pragma',
  Warning = 'Warning',

  // Conditionals
  Last_Modified = 'Last-Modified',
  ETag = 'ETag',
  If_Match = 'If-Match',
  If_None_Match = 'If-None-Match',
  If_Modified_Since = 'If-Modified-Since',
  If_Unmodified_Since = 'If-Unmodified-Since',
  Vary = 'Vary',

  // Connection management
  Connection = 'Connection',
  Keep_Alive = 'Keep-Alive',

  // Content negotiation
  Accept = 'Accept',
  Accept_Charset = 'Accept-Charset',
  Accept_Encoding = 'Accept-Encoding',
  Accept_Language = 'Accept-Language',

  // Controls
  Expect = 'Expect',

  // Cookies
  Cookie = 'Cookie',
  Set_Cookie = 'Set-Cookie',

  // CORS
  Access_Control_Allow_Origin = 'Access-Control-Allow-Origin',
  Access_Control_Allow_Credentials = 'Access-Control-Allow-Credentials',
  Access_Control_Allow_Headers = 'Access-Control-Allow-Headers',
  Access_Control_Allow_Methods = 'Access-Control-Allow-Methods',
  Access_Control_Expose_Headers = 'Access-Control-Expose-Headers',
  Access_Control_Max_Age = 'Access-Control-Max-Age',
  Access_Control_Request_Headers = 'Access-Control-Request-Headers',
  Access_Control_Request_Method = 'Access-Control-Request-Method',
  Origin = 'Origin',
  Timing_Allow_Origin = 'Timing-Allow-Origin',

  // Do Not Track
  DNT = 'DNT',
  Tk = 'Tk',

  // Downloads
  Content_Disposition = 'Content-Disposition',

  // Message body information
  Content_Length = 'Content-Length',
  Content_Type = 'Content-Type',
  Content_Encoding = 'Content-Encoding',
  Content_Language = 'Content-Language',
  Content_Location = 'Content-Location',

  // Proxies
  Forwarded = 'Forwarded',
  Via = 'Via',

  // Redirects
  Location = 'Location',

  // Request context
  From = 'From',
  Host = 'Host',
  Referer = 'Referer',
  Referrer_Policy = 'Referrer-Policy',
  User_Agent = 'User-Agent',

  // Response context
  Allow = 'Allow',
  Server = 'Server',

  // Range requests
  Accept_Ranges = 'Accept-Ranges',
  Range = 'Range',
  If_Range = 'If-Range',
  Content_Range = 'Content-Range',

  // Security
  Cross_Origin_Opener_Policy = 'Cross-Origin-Opener-Policy',
  Cross_Origin_Resource_Policy = 'Cross-Origin-Resource-Policy',
  Content_Security_Policy = 'Content-Security-Policy',
  Content_Security_Policy_Report_Only = 'Content-Security-Policy-Report-Only',
  Expect_CT = 'Expect-CT',
  Feature_Policy = 'Feature-Policy',
  Public_Key_Pins = 'Public-Key-Pins',
  Public_Key_Pins_Report_Only = 'Public-Key-Pins-Report-Only',
  Strict_Transport_Security = 'Strict-Transport-Security',
  Upgrade_Insecure_Requests = 'Upgrade-Insecure-Requests',
  X_Content_Type_Options = 'X-Content-Type-Options',
  X_Frame_Options = 'X-Frame-Options',
  X_Powered_By = 'X-Powered-By',
  X_XSS_Protection = 'X-XSS-Protection',

  // Transfer coding
  Transfer_Encoding = 'Transfer-Encoding',
  TE = 'TE',
  Trailer = 'Trailer',

  // WebSockets
  Sec_WebSocket_Accept = 'Sec-WebSocket-Accept',

  // Other
  Alt_Svc = 'Alt-Svc',
  Date = 'Date',
  Large_Allocation = 'Large-Allocation',
  Link = 'Link',
  Retry_After = 'Retry-After',
  Server_Timing = 'Server-Timing',
  SourceMap = 'SourceMap',
  X_DNS_Prefetch_Control = 'X-DNS-Prefetch-Control'
}
