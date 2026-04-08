import { parseFilePath } from "./utils";
import { handleRequestGet } from "./get";
import { handleRequestHead } from "./head";
import { handleRequestPropfind } from "./propfind";
import { MANIFEST } from "./_manifest_data";

async function handleRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, HEAD, OPTIONS, PROPFIND",
      DAV: "1",
      "MS-Author-Via": "DAV",
    },
  });
}

export const onRequest: PagesFunction = async function (context) {
  const { request } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") return handleRequestOptions();

  const filePath = parseFilePath(context);
  const params = { filePath, request, manifest: MANIFEST };

  if (method === "GET") return handleRequestGet(params);
  if (method === "HEAD") return handleRequestHead(params);
  if (method === "PROPFIND") return handleRequestPropfind(params);

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, HEAD, OPTIONS, PROPFIND" },
  });
};
