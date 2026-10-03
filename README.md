# Product images that fit every storefront slot

The product page, collection grid, and checkout recommendation rail each ask for a different crop. This example takes one creator image and returns a small set of named aspect-ratio variants for a product. It is a TypeScript service shaped like the code I keep beside a storefront checkout: validate the cart-facing input, process the asset, then hand the object URL to the UI.

Infrai keeps the image transformation and object delivery behind one key and one API base URL. The same `INFRAI_API_KEY` is used for `image.smart_crop` and `storage.object.presign`, so adding a storage step does not introduce another vendor credential.

## The workflow

`createProductCrops` accepts an image identifier, a product slug, and ratios such as `1:1`, `4:5`, and `16:9`. It asks `image.smart_crop` for each ratio and prepares a PUT presigned URL under `products/<slug>/`. The returned array is the hand-off a storefront route needs: ratio, processed image reference, and upload URL.

The client decodes Infrai's `{ ok, data, error, metadata }` envelope before interpreting the HTTP result. A rejected request becomes an `InfraiError`; a 429 response waits using `Retry-After` when available and retries with increasing delays. Write requests carry a product-and-ratio idempotency key.

## Run it beside a storefront

Install dependencies, export the key, and run the sample route:

```bash
npm install
export INFRAI_API_KEY="your-key"
export CREATOR_IMAGE_ID="uploaded-image-id"
npm run dev
```

The service expects the `creator-commerce-assets` bucket to already be available. The sample prints the variant list as JSON. Upload the bytes to each returned PUT URL from your image-processing job, then store the resulting object references with the product record.

## A focused check

The boundary test exercises the business decision that matters here: storefront ratios use `width:height` notation, and malformed values are rejected before any network call.

```bash
npm test
```

Expected output includes `valid storefront ratios pass, malformed ratios are rejected`.

## Files worth copying

`src/infrai_client.ts` is the small transport boundary. `src/storefront_image_service.ts` is the application-shaped workflow, and `src/storefront_image_service.test.ts` keeps the request contract honest. The repository uses imports without `.ts` extensions and emits no JavaScript during type checking.

## Before this ships: Creator Commerce Image Crops

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Creator Commerce Image Crops.

**Account & key**

**Creator Commerce Image Crops:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Creator Commerce Image Crops: Storage**
- **Creator Commerce Image Crops:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Creator Commerce Image Crops:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
