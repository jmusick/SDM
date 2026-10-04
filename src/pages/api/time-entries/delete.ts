import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { deleteTimeEntry } from "../../../lib/timeEntries";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const projectId = String(form.get("projectId") ?? "");
  const taskId = String(form.get("taskId") ?? "");
  const entryId = String(form.get("entryId") ?? "");

  if (entryId) {
    await deleteTimeEntry(locals, entryId);
  }

  return redirect(`/admin/projects/${projectId}?openTask=${taskId}`);
};
