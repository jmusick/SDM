import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { createProject, updateProject, type ProjectStatus } from "../../../lib/projects";

export const prerender = false;

function parseDate(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const ms = new Date(`${str}T00:00:00Z`).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
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
