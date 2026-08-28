import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { createClient, updateClient } from "../../../lib/clients";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const clientId = String(form.get("clientId") ?? "");
  const companyName = String(form.get("companyName") ?? "").trim();
  const contactName = String(form.get("contactName") ?? "");
  const phone = String(form.get("phone") ?? "");

  if (!companyName) {
    return redirect(clientId ? `/admin/clients/${clientId}?error=invalid` : "/admin/clients/new?error=invalid");
  }

  if (clientId) {
    await updateClient(locals, clientId, { companyName, contactName, phone });
    return redirect(`/admin/clients/${clientId}`);
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return redirect("/admin/clients/new?error=invalid");
  }

  try {
    const { clientId: newId, flashId } = await createClient(locals, { email, companyName, contactName, phone });
    return redirect(`/admin/clients/${newId}?pwflash=${flashId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE")) {
      return redirect("/admin/clients/new?error=duplicate");
    }
    throw error;
  }
};
