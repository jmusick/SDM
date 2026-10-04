import type { APIContext } from "astro";

function reject(status: number, error: string): Response {
  return Response.json({ ok: false, error }, { status });
}

/** Count streamed bytes before any parser/hash; Content-Length is only a hint. */
export async function validateMutationBody(context: APIContext, json: boolean): Promise<Response | null> {
  const request = context.request;
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const byteLimit = json ? 8 * 1024 : 64 * 1024;
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > byteLimit) return reject(413, "body_too_large");
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > byteLimit) {
          void reader.cancel().catch(() => {});
          return reject(413, "body_too_large");
        }
        chunks.push(chunk.value);
      }
    } catch {
      return reject(400, "invalid_body");
    } finally { reader.releaseLock(); }
  }
  // Current plain POST forms are URL-encoded and have no file-upload fields.
  // Consume a bounded body before rejecting its type so normal transports can
  // reuse the connection. Oversized streams are still cancelled immediately.
  if (json ? type !== "application/json" : type !== "application/x-www-form-urlencoded") {
    return reject(415, "unsupported_media_type");
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const bounded = new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } });
  if (json) {
    try { context.locals.requestBody = { kind: "json", value: await bounded.json() }; }
    catch { return reject(400, "invalid_json"); }
    return null;
  }
  let form: FormData;
  try { form = await bounded.formData(); }
  catch { return reject(400, "invalid_body"); }
  const names = new Set<string>();
  let count = 0;
  for (const [name, value] of form.entries()) {
    if (++count > 32 || name.length > 128 || names.has(name) || typeof value !== "string") {
      return reject(400, "invalid_fields");
    }
    names.add(name);
    const max = /password/i.test(name) ? 1024 : name === "email" ? 320 : name === "operatorSecret" ? 512 : 4096;
    if (Array.from(value).length > max) return reject(400, "field_too_long");
  }
  context.locals.requestBody = { kind: "form", value: form };
  return null;
}
/** Mutation routes read the middleware's byte-bounded, validated parse once. */
export function readForm(context: APIContext): FormData {
  const body = context.locals.requestBody;
  if (body?.kind !== "form") throw new Error("Validated form unavailable");
  return body.value;
}

export function readJson(context: APIContext): unknown {
  const body = context.locals.requestBody;
  if (body?.kind !== "json") throw new Error("Validated JSON unavailable");
  return body.value;
}
