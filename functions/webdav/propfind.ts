import {
  FileEntry,
  RequestHandlerParams,
  WEBDAV_ENDPOINT,
  getChildren,
  getDescendants,
  findEntry,
} from "./utils";

function toHttpDate(iso: string): string {
  return new Date(iso).toUTCString();
}

function encodeHref(filePath: string, isDirectory: boolean): string {
  const segments = filePath.split("/").map(s => encodeURIComponent(s)).join("/");
  const base = WEBDAV_ENDPOINT + segments;
  return isDirectory ? base + "/" : base;
}

function renderEntry(entry: FileEntry): string {
  const href = encodeHref(entry.path, entry.isDirectory);
  const resourceType = entry.isDirectory ? "<D:collection/>" : "";
  return `
  <D:response>
    <D:href>${href}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${resourceType}</D:resourcetype>
        <D:getcontentlength>${entry.size}</D:getcontentlength>
        <D:getcontenttype>${entry.contentType}</D:getcontenttype>
        <D:getlastmodified>${toHttpDate(entry.lastModified)}</D:getlastmodified>
        <D:creationdate>${entry.lastModified}</D:creationdate>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
}

function renderRoot(now: string): string {
  return `
  <D:response>
    <D:href>${WEBDAV_ENDPOINT}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getcontentlength>0</D:getcontentlength>
        <D:getcontenttype>application/x-directory</D:getcontenttype>
        <D:getlastmodified>${toHttpDate(now)}</D:getlastmodified>
        <D:creationdate>${now}</D:creationdate>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
}

export async function handleRequestPropfind({
  filePath,
  request,
  manifest,
}: RequestHandlerParams): Promise<Response> {
  const depth = request.headers.get("Depth") ?? "1";
  const isRoot = filePath === "";

  // Resolve the requested entry
  let rootEntry: FileEntry | null = null;
  if (!isRoot) {
    const found = findEntry(manifest, filePath);
    if (!found) return new Response("Not Found", { status: 404 });
    rootEntry = found;
  }

  const isDirectory = isRoot || (rootEntry?.isDirectory ?? false);

  let children: FileEntry[] = [];
  if (isDirectory && depth !== "0") {
    if (depth === "1") {
      children = getChildren(manifest, filePath);
    } else {
      // infinity
      children = getDescendants(manifest, filePath);
    }
  }

  const items: string[] = [];

  if (isRoot) {
    items.push(renderRoot(manifest.generatedAt));
  } else {
    items.push(renderEntry(rootEntry!));
  }

  for (const child of children) {
    items.push(renderEntry(child));
  }

  const body = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
${items.join("")}
</D:multistatus>`;

  return new Response(body, {
    status: 207,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
