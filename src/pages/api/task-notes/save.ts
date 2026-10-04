import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { createNote, updateNote } from "../../../lib/notes";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const projectId = String(form.get("projectId") ?? "");
  const taskId = String(form.get("taskId") ?? "");
  const noteId = String(form.get("noteId") ?? "");
  const body = String(form.get("body") ?? "").trim();

  if (!projectId || !taskId || !body) {
    return redirect(`/admin/projects/${projectId}?openTask=${taskId}&error=note_invalid`);
  }

  if (noteId) {
    await updateNote(locals, "task_notes", noteId, body);
  } else {
    await createNote(locals, "task_notes", { parentId: taskId, authorUserId: guard.id, body });
  }

  return redirect(`/admin/projects/${projectId}?openTask=${taskId}`);
};
