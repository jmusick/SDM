import { defineMiddleware } from "astro:middleware";
import { env as workerEnv } from "cloudflare:workers";
import { getSessionAndUserByToken } from "./lib/auth";
import { getClientById } from "./lib/clients";

const SESSION_COOKIE = "sdm_session";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.session = null;
  context.locals.impersonatedClient = null;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token && ((workerEnv as unknown) as { DB?: unknown }).DB) {
    try {
      const { session, user } = await getSessionAndUserByToken(context.locals, token);
      context.locals.session = session;
      context.locals.user = user;

      if (user?.role === "admin" && session?.impersonatingClientId) {
        context.locals.impersonatedClient = await getClientById(context.locals, session.impersonatingClientId);
      }
    } catch {
      context.cookies.delete(SESSION_COOKIE, { path: "/" });
    }
  }

  return next();
});

export { SESSION_COOKIE };
