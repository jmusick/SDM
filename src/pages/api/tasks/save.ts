import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { createTask, updateTask, type TaskPriority, type TaskType } from "../../../lib/tasks";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const taskId = String(form.get("taskId") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "");
  const type = String(form.get("type") ?? "task") as TaskType;
  const priority = String(form.get("priority") ?? "normal") as TaskPriority;
  const assignedToUserId = String(form.get("assignedToUserId") ?? "") || null;

  if (!projectId || !title) {
    return redirect(`/admin/projects/${projectId}?error=task_invalid`);
  }

  let finalTaskId = taskId;
  if (taskId) {
    await updateTask(locals, taskId, { title, description, type, priority, assignedToUserId });
  } else {
    finalTaskId = await createTask(locals, { projectId, title, description, type, priority, assignedToUserId });
  }

  return redirect(`/admin/projects/${projectId}?openTask=${finalTaskId}`);
};
