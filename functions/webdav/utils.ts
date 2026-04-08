export interface FileEntry {
  path: string;        // relative to /files/, no leading slash, no trailing slash
  isDirectory: boolean;
  size: number;
  lastModified: string;  // ISO 8601
  contentType: string;
}

export interface Manifest {
  generatedAt: string;
  files: FileEntry[];
}

export interface RequestHandlerParams {
  filePath: string;
  request: Request;
  manifest: Manifest;
}

export const WEBDAV_ENDPOINT = "/webdav/";

export function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}

// Returns direct children (files and subdirectories) of the given directory path.
// Use empty string for root.
export function getChildren(manifest: Manifest, dirPath: string): FileEntry[] {
  return manifest.files.filter(entry => {
    if (dirPath === "") return !entry.path.includes("/");
    if (!entry.path.startsWith(dirPath + "/")) return false;
    return !entry.path.slice(dirPath.length + 1).includes("/");
  });
}

// Returns all descendants of the given directory path.
export function getDescendants(manifest: Manifest, dirPath: string): FileEntry[] {
  if (dirPath === "") return manifest.files;
  return manifest.files.filter(e => e.path.startsWith(dirPath + "/"));
}

export function findEntry(manifest: Manifest, filePath: string): FileEntry | undefined {
  return manifest.files.find(e => e.path === filePath);
}

export function parseFilePath(context: any): string {
  const { params } = context;
  if (!params.path) return "";
  const segments = Array.isArray(params.path) ? params.path : [params.path];
  return decodeURIComponent(segments.join("/")).replace(/\/+$/, "");
}
