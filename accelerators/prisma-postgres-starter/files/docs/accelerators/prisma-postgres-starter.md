# Prisma + Postgres starter

## Schema datasource block

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Import the client everywhere as `import { prisma } from '@/src/lib/db'`.
