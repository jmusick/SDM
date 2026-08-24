import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { deleteNote } from "../../../lib/notes";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const noteId = String(form.get("noteId") ?? "");

  if (noteId) {
    await deleteNote(locals, "project_notes", noteId);
  }

  return redirect(`/admin/projects/${projectId}`);
};
