import { access, rm } from "node:fs/promises";
import { constants } from "node:fs";

const middlewareCandidates = [
  "src/middleware.ts",
  "src/middleware.js",
  "src/middleware.mjs",
  "src/middleware.cjs"
];

const removed = [];

for (const candidate of middlewareCandidates) {
  try {
    await access(candidate, constants.F_OK);
    await rm(candidate);
    removed.push(candidate);
  } catch {
    // Ignore missing files.
  }
}

if (removed.length > 0) {
  console.warn(
    `Removed legacy middleware entrypoints (${removed.join(
      ", "
    )}); Clerk requires src/proxy.ts only.`
  );
}
