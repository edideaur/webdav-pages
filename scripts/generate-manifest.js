#!/usr/bin/env node
// Generates functions/webdav/_manifest_data.js from the /files/ directory.
// Cloudflare Pages bundles this import into the Worker — no runtime subrequests needed.
// Build command: node scripts/generate-manifest.js

const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  // Text / markup
  ".txt":        "text/plain",
  ".text":       "text/plain",
  ".log":        "text/plain",
  ".conf":       "text/plain",
  ".cfg":        "text/plain",
  ".ini":        "text/plain",
  ".env":        "text/plain",
  ".html":       "text/html",
  ".htm":        "text/html",
  ".shtml":      "text/html",
  ".css":        "text/css",
  ".csv":        "text/csv",
  ".tsv":        "text/tab-separated-values",
  ".md":         "text/markdown",
  ".markdown":   "text/markdown",
  ".rtf":        "text/rtf",
  ".ics":        "text/calendar",
  ".vcf":        "text/vcard",
  ".vcard":      "text/vcard",
  ".diff":       "text/x-diff",
  ".patch":      "text/x-diff",
  ".vtt":        "text/vtt",
  ".srt":        "application/x-subrip",
  ".ass":        "text/x-ssa",
  ".ssa":        "text/x-ssa",
  ".sub":        "text/x-microdvd",

  // JavaScript / JSON
  ".js":         "application/javascript",
  ".mjs":        "application/javascript",
  ".cjs":        "application/javascript",
  ".jsx":        "application/javascript",
  ".json":       "application/json",
  ".jsonl":      "application/x-ndjson",
  ".ndjson":     "application/x-ndjson",
  ".map":        "application/json",

  // TypeScript (served as source)
  ".ts":         "application/typescript",
  ".tsx":        "application/typescript",
  ".d.ts":       "application/typescript",

  // Web / data formats
  ".xml":        "application/xml",
  ".xhtml":      "application/xhtml+xml",
  ".yaml":       "application/yaml",
  ".yml":        "application/yaml",
  ".toml":       "application/toml",
  ".wasm":       "application/wasm",
  ".graphql":    "application/graphql",
  ".gql":        "application/graphql",
  ".sql":        "application/sql",
  ".proto":      "text/plain",

  // Programming languages
  ".sh":         "text/x-shellscript",
  ".bash":       "text/x-shellscript",
  ".zsh":        "text/x-shellscript",
  ".fish":       "text/x-shellscript",
  ".bat":        "text/x-batch",
  ".cmd":        "text/x-batch",
  ".ps1":        "application/x-powershell",
  ".py":         "text/x-python",
  ".pyw":        "text/x-python",
  ".rb":         "text/x-ruby",
  ".java":       "text/x-java-source",
  ".c":          "text/x-csrc",
  ".h":          "text/x-csrc",
  ".cpp":        "text/x-c++src",
  ".cxx":        "text/x-c++src",
  ".cc":         "text/x-c++src",
  ".hpp":        "text/x-c++src",
  ".hxx":        "text/x-c++src",
  ".cs":         "text/x-csharp",
  ".go":         "text/x-go",
  ".rs":         "text/x-rustsrc",
  ".swift":      "text/x-swift",
  ".kt":         "text/x-kotlin",
  ".kts":        "text/x-kotlin",
  ".php":        "application/x-php",
  ".pl":         "text/x-perl",
  ".pm":         "text/x-perl",
  ".r":          "text/x-r",
  ".lua":        "text/x-lua",
  ".dart":       "application/vnd.dart",
  ".scala":      "text/x-scala",
  ".clj":        "text/x-clojure",
  ".cljs":       "text/x-clojure",
  ".ex":         "text/x-elixir",
  ".exs":        "text/x-elixir",
  ".erl":        "text/x-erlang",
  ".hrl":        "text/x-erlang",
  ".hs":         "text/x-haskell",
  ".lhs":        "text/x-haskell",
  ".ml":         "text/x-ocaml",
  ".mli":        "text/x-ocaml",
  ".f":          "text/x-fortran",
  ".f90":        "text/x-fortran",
  ".f95":        "text/x-fortran",
  ".asm":        "text/x-asm",
  ".s":          "text/x-asm",
  ".v":          "text/x-verilog",
  ".sv":         "text/x-systemverilog",
  ".vhd":        "text/x-vhdl",
  ".vhdl":       "text/x-vhdl",
  ".tcl":        "text/x-tcl",
  ".nim":        "text/x-nim",
  ".zig":        "text/x-zig",
  ".jl":         "text/x-julia",
  ".groovy":     "text/x-groovy",
  ".gradle":     "text/x-groovy",
  ".m":          "text/x-matlab",
  ".coffee":     "text/coffeescript",

  // Images — raster
  ".jpg":        "image/jpeg",
  ".jpeg":       "image/jpeg",
  ".jfif":       "image/jpeg",
  ".png":        "image/png",
  ".apng":       "image/apng",
  ".gif":        "image/gif",
  ".webp":       "image/webp",
  ".avif":       "image/avif",
  ".bmp":        "image/bmp",
  ".tiff":       "image/tiff",
  ".tif":        "image/tiff",
  ".ico":        "image/x-icon",
  ".cur":        "image/x-win-bitmap",
  ".heic":       "image/heic",
  ".heif":       "image/heif",
  ".jxl":        "image/jxl",
  ".hdr":        "image/vnd.radiance",
  ".exr":        "image/x-exr",
  ".dds":        "image/vnd.ms-dds",
  ".ktx":        "image/ktx",
  ".ktx2":       "image/ktx2",
  ".pnm":        "image/x-portable-anymap",
  ".pgm":        "image/x-portable-graymap",
  ".ppm":        "image/x-portable-pixmap",
  ".pbm":        "image/x-portable-bitmap",
  ".xbm":        "image/x-xbitmap",
  ".xpm":        "image/x-xpixmap",
  ".xcf":        "image/x-xcf",
  ".psd":        "image/vnd.adobe.photoshop",
  ".ai":         "application/postscript",
  ".eps":        "application/postscript",
  ".ps":         "application/postscript",
  // RAW camera formats
  ".raw":        "image/x-raw",
  ".arw":        "image/x-sony-arw",
  ".cr2":        "image/x-canon-cr2",
  ".cr3":        "image/x-canon-cr3",
  ".nef":        "image/x-nikon-nef",
  ".orf":        "image/x-olympus-orf",
  ".rw2":        "image/x-panasonic-rw2",
  ".dng":        "image/x-adobe-dng",
  ".raf":        "image/x-fuji-raf",
  ".pef":        "image/x-pentax-pef",

  // Images — vector / other
  ".svg":        "image/svg+xml",
  ".svgz":       "image/svg+xml",

  // Audio
  ".mp3":        "audio/mpeg",
  ".aac":        "audio/aac",
  ".flac":       "audio/flac",
  ".wav":        "audio/wav",
  ".wave":       "audio/wav",
  ".ogg":        "audio/ogg",
  ".oga":        "audio/ogg",
  ".opus":       "audio/opus",
  ".m4a":        "audio/mp4",
  ".aiff":       "audio/aiff",
  ".aif":        "audio/aiff",
  ".aifc":       "audio/aiff",
  ".au":         "audio/basic",
  ".snd":        "audio/basic",
  ".mid":        "audio/midi",
  ".midi":       "audio/midi",
  ".wma":        "audio/x-ms-wma",
  ".ra":         "audio/x-realaudio",
  ".ram":        "audio/x-realaudio",
  ".amr":        "audio/amr",
  ".mka":        "audio/x-matroska",
  ".spx":        "audio/ogg",
  ".caf":        "audio/x-caf",
  ".dsf":        "audio/x-dsf",
  ".dff":        "audio/x-dff",
  ".ape":        "audio/x-ape",
  ".wv":         "audio/x-wavpack",
  ".mp2":        "audio/mpeg",
  ".ac3":        "audio/ac3",
  ".eac3":       "audio/eac3",
  ".dts":        "audio/vnd.dts",

  // Video
  ".mp4":        "video/mp4",
  ".m4v":        "video/mp4",
  ".mov":        "video/quicktime",
  ".qt":         "video/quicktime",
  ".avi":        "video/x-msvideo",
  ".wmv":        "video/x-ms-wmv",
  ".flv":        "video/x-flv",
  ".mkv":        "video/x-matroska",
  ".webm":       "video/webm",
  ".ogv":        "video/ogg",
  ".mpeg":       "video/mpeg",
  ".mpg":        "video/mpeg",
  ".m2v":        "video/mpeg",
  ".m2ts":       "video/mp2t",
  ".mts":        "video/mp2t",
  ".3gp":        "video/3gpp",
  ".3g2":        "video/3gpp2",
  ".rm":         "application/vnd.rn-realmedia",
  ".rmvb":       "application/vnd.rn-realmedia-vbr",
  ".asf":        "video/x-ms-asf",
  ".divx":       "video/x-divx",
  ".vob":        "video/x-ms-vob",
  ".f4v":        "video/mp4",
  ".hevc":       "video/hevc",
  ".m3u8":       "application/vnd.apple.mpegurl",
  ".m3u":        "audio/x-mpegurl",
  ".mpd":        "application/dash+xml",

  // Documents
  ".pdf":        "application/pdf",
  ".doc":        "application/msword",
  ".docx":       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls":        "application/vnd.ms-excel",
  ".xlsx":       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt":        "application/vnd.ms-powerpoint",
  ".pptx":       "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odt":        "application/vnd.oasis.opendocument.text",
  ".ods":        "application/vnd.oasis.opendocument.spreadsheet",
  ".odp":        "application/vnd.oasis.opendocument.presentation",
  ".odg":        "application/vnd.oasis.opendocument.graphics",
  ".ott":        "application/vnd.oasis.opendocument.text-template",
  ".epub":       "application/epub+zip",
  ".mobi":       "application/x-mobipocket-ebook",
  ".azw":        "application/vnd.amazon.ebook",
  ".azw3":       "application/vnd.amazon.ebook",
  ".pages":      "application/x-iwork-pages-sffpages",
  ".numbers":    "application/x-iwork-numbers-sffnumbers",
  ".keynote":    "application/x-iwork-keynote-sffkey",
  ".xps":        "application/vnd.ms-xpsdocument",
  ".oxps":       "application/oxps",

  // Fonts
  ".woff":       "font/woff",
  ".woff2":      "font/woff2",
  ".ttf":        "font/ttf",
  ".otf":        "font/otf",
  ".eot":        "application/vnd.ms-fontobject",
  ".afm":        "application/x-font-afm",
  ".pfb":        "application/x-font-type1",
  ".pfm":        "application/x-font-type1",

  // Archives / compression
  ".zip":        "application/zip",
  ".gz":         "application/gzip",
  ".tgz":        "application/x-tar",
  ".tar":        "application/x-tar",
  ".bz2":        "application/x-bzip2",
  ".tbz2":       "application/x-tar",
  ".xz":         "application/x-xz",
  ".txz":        "application/x-tar",
  ".zst":        "application/zstd",
  ".lz":         "application/x-lzip",
  ".lz4":        "application/x-lz4",
  ".lzma":       "application/x-lzma",
  ".7z":         "application/x-7z-compressed",
  ".rar":        "application/vnd.rar",
  ".cab":        "application/vnd.ms-cab-compressed",
  ".br":         "application/x-brotli",
  ".zlib":       "application/zlib",
  ".cpio":       "application/x-cpio",
  ".ar":         "application/x-archive",

  // Disk / package / installer
  ".deb":        "application/vnd.debian.binary-package",
  ".rpm":        "application/x-rpm",
  ".apk":        "application/vnd.android.package-archive",
  ".jar":        "application/java-archive",
  ".war":        "application/java-archive",
  ".ear":        "application/java-archive",
  ".dmg":        "application/x-apple-diskimage",
  ".iso":        "application/x-iso9660-image",
  ".img":        "application/x-raw-disk-image",
  ".vmdk":       "application/x-vmdk",
  ".vdi":        "application/x-virtualbox-vdi",
  ".qcow2":      "application/x-qemu-disk",
  ".msi":        "application/x-msi",
  ".exe":        "application/vnd.microsoft.portable-executable",
  ".dll":        "application/vnd.microsoft.portable-executable",
  ".so":         "application/x-sharedlib",
  ".dylib":      "application/x-mach-binary",
  ".elf":        "application/x-elf",
  ".pkg":        "application/x-xar",
  ".flatpak":    "application/vnd.flatpak",
  ".snap":       "application/vnd.snap",
  ".appimage":   "application/x-executable",
  ".xar":        "application/x-xar",

  // 3D / CAD / model
  ".obj":        "model/obj",
  ".stl":        "model/stl",
  ".glb":        "model/gltf-binary",
  ".gltf":       "model/gltf+json",
  ".dae":        "model/vnd.collada+xml",
  ".ply":        "model/x-ply",
  ".3ds":        "application/x-3ds",
  ".step":       "model/step",
  ".stp":        "model/step",
  ".iges":       "model/iges",
  ".igs":        "model/iges",
  ".usdz":       "model/vnd.usdz+zip",
  ".fbx":        "application/octet-stream",
  ".blend":      "application/x-blender",
  ".skp":        "application/vnd.sketchup.skp",
  ".f3d":        "application/octet-stream",
  ".3mf":        "model/3mf",
  ".amf":        "application/x-amf",

  // Geo / GIS
  ".geojson":    "application/geo+json",
  ".gpx":        "application/gpx+xml",
  ".kml":        "application/vnd.google-earth.kml+xml",
  ".kmz":        "application/vnd.google-earth.kmz",
  ".topojson":   "application/json",
  ".shp":        "application/x-esri-shape",
  ".dbf":        "application/x-dbf",
  ".nc":         "application/x-netcdf",
  ".fits":       "image/fits",

  // Data / science
  ".sqlite":     "application/vnd.sqlite3",
  ".sqlite3":    "application/vnd.sqlite3",
  ".db":         "application/vnd.sqlite3",
  ".parquet":    "application/vnd.apache.parquet",
  ".avro":       "application/vnd.apache.avro",
  ".arrow":      "application/vnd.apache.arrow.file",
  ".h5":         "application/x-hdf5",
  ".hdf5":       "application/x-hdf5",
  ".mat":        "application/x-matlab-data",
  ".npy":        "application/x-npy",
  ".npz":        "application/zip",
  ".pkl":        "application/octet-stream",
  ".pickle":     "application/octet-stream",
  ".rds":        "application/octet-stream",
  ".rdata":      "application/octet-stream",

  // Certificates / keys / crypto
  ".pem":        "application/x-pem-file",
  ".crt":        "application/x-x509-ca-cert",
  ".cer":        "application/x-x509-ca-cert",
  ".der":        "application/x-x509-ca-cert",
  ".p12":        "application/x-pkcs12",
  ".pfx":        "application/x-pkcs12",
  ".p7b":        "application/x-pkcs7-certificates",
  ".p7c":        "application/pkcs7-mime",
  ".csr":        "application/pkcs10",
  ".key":        "application/x-pem-file",
  ".asc":        "application/pgp-keys",
  ".gpg":        "application/pgp-encrypted",
  ".sig":        "application/pgp-signature",

  // Email
  ".eml":        "message/rfc822",
  ".mbox":       "application/mbox",
  ".msg":        "application/vnd.ms-outlook",
  ".pst":        "application/vnd.ms-outlook",

  // Misc application
  ".wasm":       "application/wasm",
  ".bc":         "application/llvm",
  ".swf":        "application/x-shockwave-flash",
  ".torrent":    "application/x-bittorrent",
  ".magnet":     "application/x-magnet",
  ".crx":        "application/x-chrome-extension",
  ".xpi":        "application/x-xpinstall",
  ".vsix":       "application/zip",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function walkDir(dir, baseDir, entries = []) {
  let items;
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const item of items) {
    if (item.name.startsWith(".")) continue;

    const fullPath = path.join(dir, item.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (item.isDirectory()) {
      const stat = fs.statSync(fullPath);
      entries.push({
        path: relPath,
        isDirectory: true,
        size: 0,
        lastModified: stat.mtime.toISOString(),
        contentType: "application/x-directory",
      });
      walkDir(fullPath, baseDir, entries);
    } else if (item.isFile()) {
      const stat = fs.statSync(fullPath);
      entries.push({
        path: relPath,
        isDirectory: false,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
        contentType: getMimeType(fullPath),
      });
    }
  }

  return entries;
}

const root = path.join(__dirname, "..");
const filesDir = path.join(root, "files");
const outputPath = path.join(root, "functions", "webdav", "_manifest_data.js");

const files = walkDir(filesDir, filesDir);
const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

const output = `// Auto-generated by scripts/generate-manifest.js — do not edit manually.
export const MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;

fs.writeFileSync(outputPath, output);
console.log(`_manifest_data.js generated: ${files.length} entries`);
