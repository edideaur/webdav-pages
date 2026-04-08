import { PROPFIND } from "./_dav_data";

export const onRequest: PagesFunction = async function (context) {
  const method = context.request.method.toUpperCase();
  const url = new URL(context.request.url);

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: "GET, HEAD, OPTIONS, PROPFIND", DAV: "1", "MS-Author-Via": "DAV" },
    });
  }

  const raw = context.params.path;
  const segments = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  const filePath = decodeURIComponent(segments.join("/")).replace(/\/+$/, "");

  if (method === "PROPFIND") {
    const depth = context.request.headers.get("Depth") ?? "1";
    const responses = PROPFIND[filePath];
    if (!responses) return new Response("Not Found", { status: 404 });
    const xml = responses[depth === "0" ? 0 : Math.min(1, responses.length - 1)];
    return new Response(xml, {
      status: 207,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  if (method === "GET" || method === "HEAD") {
    return Response.redirect(url.pathname, 302);
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, HEAD, OPTIONS, PROPFIND" },
  });
};