import assert from "node:assert/strict";
import { cropRequest } from "./storefront_image_service.js";

const parsed = cropRequest.safeParse({ image: "img_123", productSlug: "canvas-tote", aspects: ["1:1", "4:5"] });
assert.equal(parsed.success, true);
if (parsed.success) assert.deepEqual(parsed.data.aspects, ["1:1", "4:5"]);
assert.equal(cropRequest.safeParse({ image: "img_123", productSlug: "canvas-tote", aspects: ["square"] }).success, false);
console.log("crop request boundary: valid storefront ratios pass, malformed ratios are rejected");
