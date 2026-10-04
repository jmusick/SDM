import type { APIRoute } from "astro";
import { readJson } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { getTaskById, updateTaskLane, TASK_LANES, type TaskLane } from "../../../lib/tasks";

export const prerender = false;

/**
 * Called via fetch() from the kanban board (drag-drop and the per-card lane select), not a form
 * submission — there's no full-page navigation to redirect, so this returns
 * JSON instead of following the rest of the app's redirect convention.
 */
export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals } = context;
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return Response.json({ ok: false, error: "unsupported_media_type" }, { status: 415 });
  }
  let body: unknown;
  try {
    body = readJson(context);
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const taskId = typeof input.taskId === "string" ? input.taskId : "";
  const lane = (typeof input.lane === "string" ? input.lane : "") as TaskLane;

  if (!taskId || !TASK_LANES.includes(lane)) {
    return Response.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const task = await getTaskById(locals, taskId);
  if (!task) {
    return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await updateTaskLane(locals, taskId, lane);
  return Response.json({ ok: true, lane });
};
