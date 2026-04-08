# webdav-pages

Read-only WebDAV server running on Cloudflare Pages. Drop files into `/files/`, deploy, and mount as a network drive from Windows, macOS, or Linux. No authentication. No writing.

## How it works

- Static files live in `/files/` and are served directly by Cloudflare's CDN
- `GET`/`HEAD` requests to `/webdav/*` redirect `302` to `/files/*`, no Worker CPU used for file transfers
- `PROPFIND` (directory listing) is answered by a Worker using a manifest baked into the bundle at build time, no subrequests at runtime
- `OPTIONS` returns DAV headers for client discovery
- Everything else gets `405`

## Setup

**1. Add files**

Drop anything into `/files/`. Subdirectories work.

**2. Configure**

Edit `config.json` to set the page title:

```json
{
  "title": "My File Server"
}
```

**3. Deploy to Cloudflare Pages**

In the Pages dashboard set:

| Setting | Value |
|---|---|
| Build command | `node scripts/generate-manifest.js` |
| Build output directory | `/` |

The build script walks `/files/`, infers MIME types, and writes `functions/webdav/_manifest_data.js`. Cloudflare's esbuild bundles that into the Worker so directory listings need zero runtime I/O.


## Mounting

Visit the site root for OS-specific instructions. The WebDAV endpoint is `/webdav/`.

| Client | Address format |
|---|---|
| Windows (Explorer / `net use`) | `https://yourdomain.com/webdav/` |
| macOS Finder (⌘K) | `https://yourdomain.com/webdav/` |
| Dolphin (KDE) | `webdavs://yourdomain.com/webdav/` |
| Nautilus (GNOME) | `davs://yourdomain.com/webdav/` |
| davfs2 | `sudo mount -t davfs https://yourdomain.com/webdav/ /mnt/webdav` |
| rclone | configure as WebDAV remote, vendor: other, no credentials |

## Adding files after deploy

1. Add files to `/files/`
2. Commit and push, Cloudflare Pages rebuilds and regenerates the manifest automatically
