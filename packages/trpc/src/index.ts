import { publicProcedure, router } from './server';
import { z } from 'zod';

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ input }) => {
      // This is where you'd call the FastAPI backend
      const res = await fetch('http://localhost:8000');
      const greeting = await res.json();
      return {
        greeting: `${greeting.Hello} ${input.text}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
