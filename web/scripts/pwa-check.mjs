/* global URL, Buffer, console, process */
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const publicDir = join(root, "public");
const srcDir = join(root, "src");

const requiredManifestFields = [
  "name",
  "short_name",
  "start_url",
  "scope",
  "display",
  "theme_color",
  "background_color",
  "icons"
];

const requiredIcons = [
  {
    path: "icons/icon-192.png",
    size: 192
  },
  {
    path: "icons/icon-512.png",
    size: 512
  },
  {
    path: "icons/icon-512-maskable.png",
    size: 512
  },
  {
    path: "icons/apple-touch-icon.png",
    size: 180
  }
];

const requiredLayoutSnippets = [
  { label: "manifest metadata", regex: /manifest:\s*["']\/manifest\.webmanifest["']/ },
  { label: "themeColor metadata", regex: /themeColor:\s*["']#[0-9a-fA-F]+["']/ },
  { label: "appleWebApp metadata", regex: /appleWebApp:\s*\{/ },
  { label: "apple icon metadata", regex: /apple:\s*["']\/icons\/apple-touch-icon\.png["']/ }
];

const checks = [];

function record(result, message) {
  checks.push({ result, message });
}

async function ensureFile(path, label) {
  try {
    await stat(path);
    record(true, `${label} exists`);
  } catch {
    record(false, `${label} is missing`);
  }
}

function readPngSize(buffer) {
  const signature = buffer.subarray(0, 8);
  const expected = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!signature.equals(expected)) {
    return null;
  }

  const ihdrOffset = 8 + 4 + 4;
  const width = buffer.readUInt32BE(ihdrOffset + 0);
  const height = buffer.readUInt32BE(ihdrOffset + 4);
  return { width, height };
}

async function checkIcons() {
  for (const icon of requiredIcons) {
    const iconPath = join(publicDir, icon.path);
    await ensureFile(iconPath, icon.path);
    try {
      const buffer = await readFile(iconPath);
      const size = readPngSize(buffer);
      if (!size) {
        record(false, `${icon.path} is not a valid PNG`);
        continue;
      }
      if (size.width !== icon.size || size.height !== icon.size) {
        record(
          false,
          `${icon.path} size is ${size.width}x${size.height}, expected ${icon.size}x${icon.size}`
        );
      } else {
        record(true, `${icon.path} size OK (${icon.size}x${icon.size})`);
      }
    } catch {
      // Missing files already recorded.
    }
  }
}

async function checkManifest() {
  const manifestPath = join(publicDir, "manifest.webmanifest");
  await ensureFile(manifestPath, "manifest.webmanifest");

  try {
    const manifestRaw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestRaw);

    for (const field of requiredManifestFields) {
      if (manifest[field] === undefined || manifest[field] === "") {
        record(false, `manifest missing ${field}`);
      } else {
        record(true, `manifest has ${field}`);
      }
    }

    if (manifest.display !== "standalone") {
      record(false, `manifest display is ${manifest.display}, expected standalone`);
    } else {
      record(true, "manifest display is standalone");
    }

    if (manifest.start_url !== "/") {
      record(false, `manifest start_url is ${manifest.start_url}, expected /`);
    } else {
      record(true, "manifest start_url is /");
    }
  } catch (error) {
    record(false, `manifest.webmanifest parse error: ${error.message}`);
  }
}

async function checkLayout() {
  const layoutPath = join(srcDir, "app", "layout.tsx");
  await ensureFile(layoutPath, "src/app/layout.tsx");

  try {
    const layout = await readFile(layoutPath, "utf8");
    for (const snippet of requiredLayoutSnippets) {
      if (snippet.regex.test(layout)) {
        record(true, `layout includes ${snippet.label}`);
      } else {
        record(false, `layout missing ${snippet.label}`);
      }
    }
  } catch {
    // Missing file already recorded.
  }
}

async function checkServiceWorker() {
  const swPath = join(publicDir, "sw.js");
  await ensureFile(swPath, "sw.js");

  try {
    const sw = await readFile(swPath, "utf8");
    if (sw.includes("addEventListener(\"install\"") && sw.includes("caches.open")) {
      record(true, "service worker includes install caching");
    } else {
      record(false, "service worker missing install caching logic");
    }

    if (sw.includes("addEventListener(\"fetch\"")) {
      record(true, "service worker includes fetch handler");
    } else {
      record(false, "service worker missing fetch handler");
    }
  } catch {
    // Missing file already recorded.
  }
}

async function checkRegistration() {
  const providersPath = join(srcDir, "app", "providers.tsx");
  await ensureFile(providersPath, "src/app/providers.tsx");

  try {
    const providers = await readFile(providersPath, "utf8");
    if (providers.includes("registerServiceWorker")) {
      record(true, "service worker registration is wired in providers.tsx");
    } else {
      record(false, "service worker registration missing in providers.tsx");
    }
  } catch {
    // Missing file already recorded.
  }
}

async function run() {
  await checkManifest();
  await checkIcons();
  await checkLayout();
  await checkServiceWorker();
  await checkRegistration();

  const failed = checks.filter((check) => !check.result);

  for (const check of checks) {
    console.log(`${check.result ? "✅" : "❌"} ${check.message}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} PWA checks failed.`);
    process.exit(1);
  } else {
    console.log("\nAll PWA static checks passed.");
  }
}

run();
