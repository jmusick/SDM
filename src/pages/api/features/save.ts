import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { createFeature, updateFeature, type FeatureStatus } from "../../../lib/features";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const featureId = String(form.get("featureId") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "");
  const status = String(form.get("status") ?? "backlog") as FeatureStatus;

  if (!projectId || !title) {
    return redirect(
      featureId
        ? `/admin/projects/${projectId}/features/${featureId}?error=invalid`
        : `/admin/projects/${projectId}/features/new?error=invalid`
    );
  }

  if (featureId) {
    await updateFeature(locals, featureId, { title, description, status });
  } else {
    await createFeature(locals, { projectId, title, description, status });
  }

  return redirect(`/admin/projects/${projectId}`);
};
