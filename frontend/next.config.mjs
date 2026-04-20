// Build CSP based on environment
function buildContentSecurityPolicy() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8001";

  // Base directives (common to all environments)
  const baseDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
  ];

  // Style and script directives vary by environment
  const styleScriptDirectives = isDevelopment
    ? [
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      ]
    : ["style-src 'self'", "script-src 'self'"];

  // Connect-src includes API URL (configurable)
  const connectDirective = `connect-src 'self' ${apiUrl}`;

  return [...baseDirectives, ...styleScriptDirectives, connectDirective].join(
    "; ",
  );
}

const contentSecurityPolicy = buildContentSecurityPolicy();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
