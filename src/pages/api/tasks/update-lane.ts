import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { getTaskById, updateTaskLane, type TaskLane } from "../../../lib/tasks";

export const prerender = false;

const VALID_LANES: TaskLane[] = ["planned", "in_progress", "qa", "done"];

/**
 * Called via fetch() from the kanban board's drag-drop handler, not a form
 * submission — there's no full-page navigation to redirect, so this returns
 * JSON instead of following the rest of the app's redirect convention.
 */
export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals } = context;
  let body: { taskId?: string; lane?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), { status: 400 });
  }

  const taskId = String(body.taskId ?? "");
  const lane = String(body.lane ?? "") as TaskLane;

  if (!taskId || !VALID_LANES.includes(lane)) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_input" }), { status: 400 });
  }

  const task = await getTaskById(locals, taskId);
  if (!task) {
    return new Response(JSON.stringify({ ok: false, error: "not_found" }), { status: 404 });
  }

  await updateTaskLane(locals, taskId, lane);
  return new Response(JSON.stringify({ ok: true, lane }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
