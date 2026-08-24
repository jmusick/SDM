import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { createTimeEntry } from "../../../lib/timeEntries";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const taskId = String(form.get("taskId") ?? "");
  const dateStr = String(form.get("date") ?? "");
  const unit = String(form.get("unit") ?? "hours");
  const amount = Number(form.get("amount"));
  const note = String(form.get("note") ?? "");

  const entryDate = dateStr ? new Date(dateStr).getTime() : NaN;
  const minutes = unit === "minutes" ? Math.round(amount) : Math.round(amount * 60);

  if (!projectId || !taskId || !Number.isFinite(entryDate) || !Number.isFinite(minutes) || minutes <= 0) {
    return redirect(`/admin/projects/${projectId}?openTask=${taskId}&error=time_invalid`);
  }

  await createTimeEntry(locals, { taskId, userId: guard.id, minutes, entryDate, note });

  return redirect(`/admin/projects/${projectId}?openTask=${taskId}`);
};
