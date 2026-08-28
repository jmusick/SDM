import type { APIRoute } from "astro";
import { invalidateSession } from "../../../lib/auth";
import { assertSameOrigin } from "../../../lib/http";
import { SESSION_COOKIE } from "../../../middleware";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { locals, cookies, redirect } = context;

  const csrf = assertSameOrigin(context);
  if (csrf) return csrf;

  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await invalidateSession(locals, token);
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return redirect("/login");
};
