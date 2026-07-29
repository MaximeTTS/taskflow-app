import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Politique de sécurité du contenu.
 *
 * `'unsafe-inline'` sur les styles est nécessaire : le thème injecte des
 * styles calculés (voir applyGlass dans components/tf/theme.tsx) et Tailwind
 * pose des styles en ligne. En développement, `'unsafe-eval'` est requis par
 * le rafraîchissement à chaud de Turbopack — jamais en production.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Cloudinary sert les avatars et les images de tâches.
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "media-src 'self'",
  "font-src 'self' data:",
  // `ws:` est indispensable au rechargement a chaud de Turbopack, qui ouvre
  // un WebSocket vers le serveur de developpement. Jamais en production.
  `connect-src 'self' https://api.cloudinary.com${isProduction ? '' : ' ws: wss:'}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .join('; ')
  .concat(isProduction ? '; upgrade-insecure-requests' : '');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // Redondant avec frame-ancestors mais couvre les navigateurs anciens.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  ...(isProduction
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
