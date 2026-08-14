import type { APIRoute } from "astro";
import { invalidateSession } from "../../../lib/auth";
import { SESSION_COOKIE } from "../../../middleware";

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await invalidateSession(locals, token);
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return redirect("/login");
};
