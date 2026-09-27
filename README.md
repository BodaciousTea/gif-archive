# Sopranos GIF Search

A static GitHub Pages frontend that searches for *The Sopranos* GIFs indexed
from Yarn. GIF media remains hosted by Yarn; the repository does not need to
store every search result.

The existing `public/` collection is retained as a fallback when live search is
unavailable. `cloudflare-worker.js` contains the source deployed to the
Cloudflare Worker used by `script.js`.
