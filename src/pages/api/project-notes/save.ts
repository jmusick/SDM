import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { createNote, updateNote } from "../../../lib/notes";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const noteId = String(form.get("noteId") ?? "");
  const body = String(form.get("body") ?? "").trim();

  if (!projectId || !body) {
    return redirect(`/admin/projects/${projectId}?error=invalid`);
  }

  if (noteId) {
    await updateNote(locals, "project_notes", noteId, body);
  } else {
    await createNote(locals, "project_notes", { parentId: projectId, authorUserId: guard.id, body });
  }

  return redirect(`/admin/projects/${projectId}`);
};
