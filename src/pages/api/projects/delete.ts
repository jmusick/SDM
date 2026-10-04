import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { deleteProject } from "../../../lib/projects";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const projectId = String(form.get("projectId") ?? "");

  if (projectId) {
    await deleteProject(locals, projectId);
  }

  return redirect("/admin/projects");
};
