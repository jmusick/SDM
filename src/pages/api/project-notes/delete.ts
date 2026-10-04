import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { deleteNote } from "../../../lib/notes";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const projectId = String(form.get("projectId") ?? "");
  const noteId = String(form.get("noteId") ?? "");

  if (noteId) {
    await deleteNote(locals, "project_notes", noteId);
  }

  return redirect(`/admin/projects/${projectId}`);
};
