import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { appRouter } from '@repo/trpc';
import { createContext } from '@repo/trpc/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({} as any),
  });

export { handler as GET, handler as POST };
