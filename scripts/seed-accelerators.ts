import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedAccelerator = {
  name: string;
  slug: string;
  description: string;
  category: string;
  capabilities: string[];
  files: { path: string; content: string }[];
};

const accelerators: SeedAccelerator[] = [
  {
    name: 'Cookie session auth',
    slug: 'cookie-session-auth',
    description:
      'Single-password, cookie-based auth gate for a small internal app. Protects routes and API endpoints with a simple httpOnly session cookie, no user table required.',
    category: 'Authentication',
    capabilities: ['auth', 'single-user', 'cookie-session', 'next.js'],
    files: [
      {
        path: 'src/lib/auth.ts',
        content: `import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'app-session';

export function getExpectedAuthPassword() {
  return process.env.AUTH_PASSWORD ?? 'changeme';
}

export function isAuthenticatedCookie(cookieValue: string | undefined) {
  return cookieValue === 'true';
}

export function isAuthenticatedRequest(request: NextRequest) {
  return isAuthenticatedCookie(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export async function isAuthenticatedRoute() {
  const cookieStore = await cookies();
  return isAuthenticatedCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function requireAuth(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
`,
      },
      {
        path: 'src/app/api/auth/login/route.ts',
        content: `import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getExpectedAuthPassword } from '@/src/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body?.password;

    if (password !== getExpectedAuthPassword()) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
`,
      },
      {
        path: 'docs/accelerators/cookie-session-auth.md',
        content: `# Cookie session auth

Drop-in single-password auth for internal tools.

## Wiring it up

1. Set \`AUTH_PASSWORD\` in your environment.
2. Guard server components with \`isAuthenticatedRoute()\` + \`redirect('/login')\`.
3. Guard API routes with \`requireAuth(request)\` and return early if it returns a response.
4. Build a \`/login\` page that POSTs \`{ password }\` to \`/api/auth/login\`.
`,
      },
    ],
  },
  {
    name: 'Prisma + Postgres starter',
    slug: 'prisma-postgres-starter',
    description:
      'Prisma client singleton safe for Next.js dev hot-reload, plus the datasource block for a Postgres-backed app.',
    category: 'Data layer',
    capabilities: ['database', 'postgres', 'prisma', 'next.js'],
    files: [
      {
        path: 'src/lib/db.ts',
        content: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
`,
      },
      {
        path: 'docs/accelerators/prisma-postgres-starter.md',
        content: `# Prisma + Postgres starter

## Schema datasource block

\`\`\`prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
\`\`\`

## Setup

\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

Import the client everywhere as \`import { prisma } from '@/src/lib/db'\`.
`,
      },
    ],
  },
  {
    name: 'AI provider wrapper (Gemini)',
    slug: 'ai-provider-wrapper-gemini',
    description:
      'Minimal fetch-based wrapper around the Gemini generateContent API with typed config/request errors, ready to plug prompt builders into.',
    category: 'AI',
    capabilities: ['ai', 'gemini', 'text-generation'],
    files: [
      {
        path: 'src/lib/ai/gemini.ts',
        content: `const DEFAULT_MODEL = 'gemini-1.5-flash';

export class GeminiConfigError extends Error {}
export class GeminiRequestError extends Error {}

function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new GeminiConfigError('GEMINI_API_KEY is not configured.');
  }

  return { apiKey, model };
}

export async function generateGeminiText(prompt: string, maxOutputTokens = 400): Promise<string> {
  const { apiKey, model } = getConfig();

  const response = await fetch(
    \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature: 0.7 },
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error?.message || \`Gemini request failed (\${response.status})\`;
    throw new GeminiRequestError(message);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') ?? '';

  if (!text.trim()) {
    throw new GeminiRequestError('Gemini returned an empty response.');
  }

  return text.trim();
}
`,
      },
      {
        path: 'docs/accelerators/ai-provider-wrapper-gemini.md',
        content: `# AI provider wrapper (Gemini)

Set \`GEMINI_API_KEY\` (and optionally \`GEMINI_MODEL\`), then call \`generateGeminiText(prompt)\` from any server route.
Write prompt-builder functions alongside it (see Eolas' \`buildBrainstormPrompt\` / \`buildBuildBriefPrompt\` for the pattern) rather than inlining prompts at the call site.
`,
      },
    ],
  },
  {
    name: 'PWA shell',
    slug: 'pwa-shell',
    description:
      'Installable PWA baseline: web app manifest, offline-first service worker with stale-while-revalidate caching, and a client-side registration component.',
    category: 'Mobile / PWA',
    capabilities: ['pwa', 'offline', 'service-worker', 'installable'],
    files: [
      {
        path: 'public/manifest.webmanifest',
        content: `{
  "name": "App Name",
  "short_name": "App",
  "description": "App description.",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#030611",
  "theme_color": "#030611"
}
`,
      },
      {
        path: 'public/sw.js',
        content: `const CACHE_NAME = 'app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function stripRedirected(response) {
  if (!response.redirected) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => stripRedirected(response))
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        const responseClone = response.clone();
        if (event.request.method === 'GET' && response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return stripRedirected(response);
      });

      if (cached) {
        event.waitUntil(networkFetch.catch(() => {}));
        return cached;
      }

      return networkFetch.catch(() => caches.match(event.request));
    }),
  );
});
`,
      },
      {
        path: 'src/app/components/service-worker-registration.tsx',
        content: `'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  }, []);

  return null;
}
`,
      },
      {
        path: 'docs/accelerators/pwa-shell.md',
        content: `# PWA shell

1. Add icons at \`/icon-192.png\`, \`/icon-512.png\`, \`/icon-maskable-512.png\`.
2. Link the manifest and set \`theme-color\` in your root layout \`<head>\`.
3. Mount \`<ServiceWorkerRegistration />\` once near the root layout.
4. Bump \`CACHE_NAME\` in \`sw.js\` whenever cached assets change, to force clients to refresh.
`,
      },
    ],
  },
];

async function main() {
  for (const accelerator of accelerators) {
    await prisma.accelerator.upsert({
      where: { slug: accelerator.slug },
      update: {
        name: accelerator.name,
        description: accelerator.description,
        category: accelerator.category,
        capabilities: accelerator.capabilities,
        files: accelerator.files,
        status: 'APPROVED',
      },
      create: {
        name: accelerator.name,
        slug: accelerator.slug,
        description: accelerator.description,
        category: accelerator.category,
        capabilities: accelerator.capabilities,
        files: accelerator.files,
        status: 'APPROVED',
      },
    });
    console.log(`Seeded accelerator: ${accelerator.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
