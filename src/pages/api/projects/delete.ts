import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { deleteProject } from "../../../lib/projects";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");

  if (projectId) {
    await deleteProject(locals, projectId);
  }

  return redirect("/admin/projects");
};
