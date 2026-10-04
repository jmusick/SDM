import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { createProject, updateProject, type ProjectStatus } from "../../../lib/projects";
import { dateValue as parseDate } from "../../../lib/mutation-validation";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const projectId = String(form.get("projectId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "");
  const status = String(form.get("status") ?? "planning") as ProjectStatus;
  const startDate = parseDate(form.get("startDate"));
  const targetDate = parseDate(form.get("targetDate"));

  if (!name) {
    return redirect(projectId ? `/admin/projects/${projectId}?error=invalid` : "/admin/projects/new?error=invalid");
  }

  if (projectId) {
    await updateProject(locals, projectId, { name, description, status, startDate, targetDate });
    return redirect(`/admin/projects/${projectId}`);
  }

  const clientId = String(form.get("clientId") ?? "").trim() || null;

  const newId = await createProject(locals, { clientId, name, description, status, startDate, targetDate });
  return redirect(`/admin/projects/${newId}`);
};
