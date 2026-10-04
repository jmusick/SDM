import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { createTimeEntry } from "../../../lib/timeEntries";
import { dateValue, timeMinutes } from "../../../lib/mutation-validation";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const projectId = String(form.get("projectId") ?? "");
  const taskId = String(form.get("taskId") ?? "");
  const dateStr = String(form.get("date") ?? "");
  const unit = String(form.get("unit") ?? "hours");
  const note = String(form.get("note") ?? "");

  const entryDate = dateValue(dateStr);
  const minutes = timeMinutes(form.get("amount"), unit);

  if (!projectId || !taskId || entryDate === null || minutes === null) {
    return redirect(`/admin/projects/${projectId}?openTask=${taskId}&error=time_invalid`);
  }

  await createTimeEntry(locals, { taskId, userId: guard.id, minutes, entryDate, note });

  return redirect(`/admin/projects/${projectId}?openTask=${taskId}`);
};
