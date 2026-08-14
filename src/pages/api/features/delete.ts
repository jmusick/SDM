import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { deleteFeature } from "../../../lib/features";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const featureId = String(form.get("featureId") ?? "");

  if (featureId) {
    await deleteFeature(locals, featureId);
  }

  return redirect(`/admin/projects/${projectId}`);
};
