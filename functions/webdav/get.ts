import { notFound, RequestHandlerParams, findEntry } from "./utils";

export async function handleRequestGet({
  filePath,
  request,
  manifest,
}: RequestHandlerParams): Promise<Response> {
  if (filePath === "") return new Response("Method Not Allowed", { status: 405 });

  const entry = findEntry(manifest, filePath);
  if (!entry) return notFound();
  if (entry.isDirectory) return new Response("Method Not Allowed", { status: 405 });

  return Response.redirect(new URL("/files/" + filePath, request.url).toString(), 302);
}
