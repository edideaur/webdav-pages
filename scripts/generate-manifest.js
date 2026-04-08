#!/usr/bin/env node
// Pre-generates all PROPFIND XML responses and a file set at build time.
// The Worker becomes a pure lookup — zero computation, zero subrequests.

const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  ".aac": "audio/aac", ".ac3": "audio/ac3", ".afm": "application/x-font-afm",
  ".ai": "application/postscript", ".aif": "audio/aiff", ".aifc": "audio/aiff",
  ".aiff": "audio/aiff", ".amf": "application/x-amf", ".amr": "audio/amr",
  ".ape": "audio/x-ape", ".apk": "application/vnd.android.package-archive",
  ".apng": "image/apng", ".appimage": "application/x-executable",
  ".ar": "application/x-archive", ".arrow": "application/vnd.apache.arrow.file",
  ".arw": "image/x-sony-arw", ".asc": "application/pgp-keys",
  ".asm": "text/x-asm", ".asf": "video/x-ms-asf", ".ass": "text/x-ssa",
  ".au": "audio/basic", ".avif": "image/avif",
  ".avro": "application/vnd.apache.avro", ".azw": "application/vnd.amazon.ebook",
  ".azw3": "application/vnd.amazon.ebook", ".bash": "text/x-shellscript",
  ".bat": "text/x-batch", ".bc": "application/llvm", ".blend": "application/x-blender",
  ".bmp": "image/bmp", ".br": "application/x-brotli", ".bz2": "application/x-bzip2",
  ".c": "text/x-csrc", ".cab": "application/vnd.ms-cab-compressed",
  ".caf": "audio/x-caf", ".cc": "text/x-c++src", ".cer": "application/x-x509-ca-cert",
  ".cfg": "text/plain", ".cjs": "application/javascript", ".clj": "text/x-clojure",
  ".cljs": "text/x-clojure", ".cmd": "text/x-batch", ".coffee": "text/coffeescript",
  ".conf": "text/plain", ".cpp": "text/x-c++src", ".cpio": "application/x-cpio",
  ".cr2": "image/x-canon-cr2", ".cr3": "image/x-canon-cr3",
  ".crt": "application/x-x509-ca-cert", ".crx": "application/x-chrome-extension",
  ".cs": "text/x-csharp", ".csr": "application/pkcs10", ".css": "text/css",
  ".csv": "text/csv", ".cur": "image/x-win-bitmap", ".cxx": "text/x-c++src",
  ".d.ts": "application/typescript", ".dae": "model/vnd.collada+xml",
  ".dart": "application/vnd.dart", ".db": "application/vnd.sqlite3",
  ".dbf": "application/x-dbf", ".dds": "image/vnd.ms-dds",
  ".deb": "application/vnd.debian.binary-package", ".der": "application/x-x509-ca-cert",
  ".dff": "audio/x-dff", ".diff": "text/x-diff", ".divx": "video/x-divx",
  ".dll": "application/vnd.microsoft.portable-executable",
  ".dmg": "application/x-apple-diskimage", ".dng": "image/x-adobe-dng",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".dsf": "audio/x-dsf", ".dts": "audio/vnd.dts", ".dylib": "application/x-mach-binary",
  ".eac3": "audio/eac3", ".ear": "application/java-archive",
  ".elf": "application/x-elf", ".eml": "message/rfc822", ".env": "text/plain",
  ".eot": "application/vnd.ms-fontobject", ".eps": "application/postscript",
  ".epub": "application/epub+zip", ".erl": "text/x-erlang", ".ex": "text/x-elixir",
  ".exe": "application/vnd.microsoft.portable-executable", ".exr": "image/x-exr",
  ".exs": "text/x-elixir", ".f": "text/x-fortran", ".f3d": "application/octet-stream",
  ".f4v": "video/mp4", ".f90": "text/x-fortran", ".f95": "text/x-fortran",
  ".fbx": "application/octet-stream", ".fish": "text/x-shellscript",
  ".fits": "image/fits", ".flac": "audio/flac",
  ".flatpak": "application/vnd.flatpak", ".flv": "video/x-flv",
  ".geojson": "application/geo+json", ".gif": "image/gif",
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json",
  ".go": "text/x-go", ".gpg": "application/pgp-encrypted",
  ".gpx": "application/gpx+xml", ".gql": "application/graphql",
  ".gradle": "text/x-groovy", ".graphql": "application/graphql",
  ".groovy": "text/x-groovy", ".gz": "application/gzip",
  ".h": "text/x-csrc", ".h5": "application/x-hdf5", ".hdf5": "application/x-hdf5",
  ".hdr": "image/vnd.radiance", ".heic": "image/heic", ".heif": "image/heif",
  ".hevc": "video/hevc", ".hpp": "text/x-c++src", ".hrl": "text/x-erlang",
  ".hs": "text/x-haskell", ".htm": "text/html", ".html": "text/html",
  ".hxx": "text/x-c++src", ".ico": "image/x-icon",
  ".ics": "text/calendar", ".iges": "model/iges", ".igs": "model/iges",
  ".img": "application/x-raw-disk-image", ".ini": "text/plain",
  ".iso": "application/x-iso9660-image", ".jar": "application/java-archive",
  ".java": "text/x-java-source", ".jfif": "image/jpeg", ".jl": "text/x-julia",
  ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".js": "application/javascript",
  ".json": "application/json", ".jsonl": "application/x-ndjson",
  ".jsx": "application/javascript", ".jxl": "image/jxl",
  ".key": "application/x-pem-file",
  ".keynote": "application/x-iwork-keynote-sffkey",
  ".kml": "application/vnd.google-earth.kml+xml",
  ".kmz": "application/vnd.google-earth.kmz", ".kt": "text/x-kotlin",
  ".kts": "text/x-kotlin", ".ktx": "image/ktx", ".ktx2": "image/ktx2",
  ".lhs": "text/x-haskell", ".log": "text/plain", ".lua": "text/x-lua",
  ".lz": "application/x-lzip", ".lz4": "application/x-lz4",
  ".lzma": "application/x-lzma", ".m": "text/x-matlab",
  ".m2ts": "video/mp2t", ".m2v": "video/mpeg", ".m3u": "audio/x-mpegurl",
  ".m3u8": "application/vnd.apple.mpegurl", ".m4a": "audio/mp4",
  ".m4v": "video/mp4", ".magnet": "application/x-magnet",
  ".map": "application/json", ".markdown": "text/markdown",
  ".mat": "application/x-matlab-data", ".mbox": "application/mbox",
  ".md": "text/markdown", ".mid": "audio/midi", ".midi": "audio/midi",
  ".mjs": "application/javascript", ".mka": "audio/x-matroska",
  ".mkv": "video/x-matroska", ".ml": "text/x-ocaml", ".mli": "text/x-ocaml",
  ".mobi": "application/x-mobipocket-ebook", ".mov": "video/quicktime",
  ".mp2": "audio/mpeg", ".mp3": "audio/mpeg", ".mp4": "video/mp4",
  ".mpd": "application/dash+xml", ".mpeg": "video/mpeg", ".mpg": "video/mpeg",
  ".msg": "application/vnd.ms-outlook", ".msi": "application/x-msi",
  ".mts": "video/mp2t", ".nc": "application/x-netcdf",
  ".ndjson": "application/x-ndjson", ".nef": "image/x-nikon-nef",
  ".nim": "text/x-nim", ".npy": "application/x-npy", ".npz": "application/zip",
  ".numbers": "application/x-iwork-numbers-sffnumbers",
  ".obj": "model/obj",
  ".odg": "application/vnd.oasis.opendocument.graphics",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".oga": "audio/ogg", ".ogg": "audio/ogg", ".ogv": "video/ogg",
  ".opus": "audio/opus", ".orf": "image/x-olympus-orf",
  ".otf": "font/otf",
  ".ott": "application/vnd.oasis.opendocument.text-template",
  ".oxps": "application/oxps", ".p12": "application/x-pkcs12",
  ".p7b": "application/x-pkcs7-certificates", ".p7c": "application/pkcs7-mime",
  ".pages": "application/x-iwork-pages-sffpages",
  ".parquet": "application/vnd.apache.parquet", ".patch": "text/x-diff",
  ".pbm": "image/x-portable-bitmap", ".pdf": "application/pdf",
  ".pef": "image/x-pentax-pef", ".pem": "application/x-pem-file",
  ".pfb": "application/x-font-type1", ".pfm": "application/x-font-type1",
  ".pfx": "application/x-pkcs12", ".pgm": "image/x-portable-graymap",
  ".php": "application/x-php", ".pickle": "application/octet-stream",
  ".pkg": "application/x-xar", ".pkl": "application/octet-stream",
  ".pl": "text/x-perl", ".ply": "model/x-ply", ".pm": "text/x-perl",
  ".png": "image/png", ".pnm": "image/x-portable-anymap",
  ".ppm": "image/x-portable-pixmap",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".proto": "text/plain", ".ps": "application/postscript",
  ".ps1": "application/x-powershell", ".psd": "image/vnd.adobe.photoshop",
  ".pst": "application/vnd.ms-outlook", ".py": "text/x-python",
  ".pyw": "text/x-python", ".qcow2": "application/x-qemu-disk",
  ".qt": "video/quicktime", ".r": "text/x-r",
  ".ra": "audio/x-realaudio", ".raf": "image/x-fuji-raf",
  ".ram": "audio/x-realaudio", ".rar": "application/vnd.rar",
  ".raw": "image/x-raw", ".rb": "text/x-ruby",
  ".rdata": "application/octet-stream", ".rds": "application/octet-stream",
  ".rm": "application/vnd.rn-realmedia", ".rmvb": "application/vnd.rn-realmedia-vbr",
  ".rpm": "application/x-rpm", ".rs": "text/x-rustsrc", ".rtf": "text/rtf",
  ".rw2": "image/x-panasonic-rw2", ".s": "text/x-asm",
  ".scala": "text/x-scala", ".sh": "text/x-shellscript",
  ".shp": "application/x-esri-shape", ".shtml": "text/html",
  ".sig": "application/pgp-signature", ".skp": "application/vnd.sketchup.skp",
  ".snap": "application/vnd.snap", ".snd": "audio/basic",
  ".so": "application/x-sharedlib", ".spx": "audio/ogg",
  ".sql": "application/sql", ".sqlite": "application/vnd.sqlite3",
  ".sqlite3": "application/vnd.sqlite3", ".srt": "application/x-subrip",
  ".ssa": "text/x-ssa", ".step": "model/step", ".stl": "model/stl",
  ".stp": "model/step", ".sub": "text/x-microdvd",
  ".sv": "text/x-systemverilog", ".svg": "image/svg+xml",
  ".svgz": "image/svg+xml", ".swf": "application/x-shockwave-flash",
  ".swift": "text/x-swift", ".tar": "application/x-tar",
  ".tbz2": "application/x-tar", ".tcl": "text/x-tcl",
  ".text": "text/plain", ".tgz": "application/x-tar", ".tif": "image/tiff",
  ".tiff": "image/tiff", ".toml": "application/toml",
  ".topojson": "application/json", ".torrent": "application/x-bittorrent",
  ".ts": "application/typescript", ".tsv": "text/tab-separated-values",
  ".tsx": "application/typescript", ".ttf": "font/ttf",
  ".txz": "application/x-tar", ".txt": "text/plain",
  ".usdz": "model/vnd.usdz+zip", ".v": "text/x-verilog",
  ".vcard": "text/vcard", ".vcf": "text/vcard", ".vdi": "application/x-virtualbox-vdi",
  ".vhd": "text/x-vhdl", ".vhdl": "text/x-vhdl",
  ".vmdk": "application/x-vmdk", ".vob": "video/x-ms-vob",
  ".vsix": "application/zip", ".vtt": "text/vtt",
  ".war": "application/java-archive", ".wasm": "application/wasm",
  ".wav": "audio/wav", ".wave": "audio/wav", ".webm": "video/webm",
  ".webp": "image/webp", ".wma": "audio/x-ms-wma", ".wmv": "video/x-ms-wmv",
  ".woff": "font/woff", ".woff2": "font/woff2", ".wv": "audio/x-wavpack",
  ".xar": "application/x-xar", ".xbm": "image/x-xbitmap",
  ".xcf": "image/x-xcf", ".xhtml": "application/xhtml+xml",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xml": "application/xml", ".xpi": "application/x-xpinstall",
  ".xpm": "image/x-xpixmap", ".xps": "application/vnd.ms-xpsdocument",
  ".xz": "application/x-xz", ".yaml": "application/yaml",
  ".yml": "application/yaml", ".zig": "text/x-zig", ".zip": "application/zip",
  ".zlib": "application/zlib", ".zsh": "text/x-shellscript",
  ".zst": "application/zstd", ".3ds": "application/x-3ds",
  ".3g2": "video/3gpp2", ".3gp": "video/3gpp", ".3mf": "model/3mf",
  ".7z": "application/x-7z-compressed",
};

function getMimeType(fp) {
  return MIME_TYPES[path.extname(fp).toLowerCase()] || "application/octet-stream";
}

// ── Walk /files/ ──

function walkDir(dir, baseDir, out = []) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const item of items) {
    if (item.name.startsWith(".")) continue;
    const full = path.join(dir, item.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, "/");
    if (item.isDirectory()) {
      out.push({ path: rel, dir: true, size: 0, mtime: fs.statSync(full).mtime.toISOString(), type: "application/x-directory" });
      walkDir(full, baseDir, out);
    } else if (item.isFile()) {
      const st = fs.statSync(full);
      out.push({ path: rel, dir: false, size: st.size, mtime: st.mtime.toISOString(), type: getMimeType(full) });
    }
  }
  return out;
}

// ── XML helpers ──

function encodeHref(p, isDir) {
  if (p === "") return "/files/";
  const encoded = p.split("/").map(encodeURIComponent).join("/");
  return isDir ? `/files/${encoded}/` : `/files/${encoded}`;
}

function entryXml(e) {
  return `<D:response>
<D:href>${encodeHref(e.path, e.dir)}</D:href>
<D:propstat>
<D:prop>
<D:resourcetype>${e.dir ? "<D:collection/>" : ""}</D:resourcetype>
<D:getcontentlength>${e.size}</D:getcontentlength>
<D:getcontenttype>${e.type}</D:getcontenttype>
<D:getlastmodified>${new Date(e.mtime).toUTCString()}</D:getlastmodified>
<D:creationdate>${e.mtime}</D:creationdate>
</D:prop>
<D:status>HTTP/1.1 200 OK</D:status>
</D:propstat>
</D:response>`;
}

function wrap(body) {
  return `<?xml version="1.0" encoding="utf-8"?>\n<D:multistatus xmlns:D="DAV:">\n${body}\n</D:multistatus>`;
}

// ── Build ──

const root = path.join(__dirname, "..");
const entries = walkDir(path.join(root, "files"), path.join(root, "files"));

const now = new Date().toISOString();
const rootEntry = { path: "", dir: true, size: 0, mtime: now, type: "application/x-directory" };

function children(dirPath) {
  return entries.filter(e => {
    if (dirPath === "") return !e.path.includes("/");
    if (!e.path.startsWith(dirPath + "/")) return false;
    return !e.path.slice(dirPath.length + 1).includes("/");
  });
}

const propfind = {};
const filePaths = [];

// Root
const rootXml = entryXml(rootEntry);
propfind[""] = [
  wrap(rootXml),
  wrap(rootXml + children("").map(entryXml).join("")),
];

// Each entry
for (const e of entries) {
  const self = entryXml(e);
  if (e.dir) {
    propfind[e.path] = [
      wrap(self),
      wrap(self + children(e.path).map(entryXml).join("")),
    ];
  } else {
    propfind[e.path] = [wrap(self)];
    filePaths.push(e.path);
  }
}

// ── Write ──

const out = `// Auto-generated — do not edit.\nexport const PROPFIND=${JSON.stringify(propfind)};\nexport const FILES=new Set(${JSON.stringify(filePaths)});\n`;
fs.writeFileSync(path.join(root, "functions", "files", "_dav_data.js"), out);

const total = entries.length;
const dirs = entries.filter(e => e.dir).length;
console.log(`_dav_data.js: ${total} entries (${dirs} dirs, ${total - dirs} files)`);
