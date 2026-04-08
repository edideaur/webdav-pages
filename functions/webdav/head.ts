import { notFound, RequestHandlerParams, findEntry } from "./utils";

export async function handleRequestHead({
  filePath,
  request,
  manifest,
}: RequestHandlerParams): Promise<Response> {
  if (filePath === "") return new Response(null, { status: 200 });

  const entry = findEntry(manifest, filePath);
  if (!entry) return notFound();

  return Response.redirect(new URL("/files/" + filePath, request.url).toString(), 302);
}
