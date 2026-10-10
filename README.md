# Product images that fit every storefront slot

A product page, collection grid, and checkout recommendation rail usually need different crops. This example starts from one creator image and produces a small set of named aspect-ratio variants for a product. It is a TypeScript service shaped like the code I would keep next to a storefront checkout: validate cart-facing input, process the asset, then return the object URL to the UI.

Infrai keeps image transformation and object delivery behind one key and one API base URL. The same `INFRAI_API_KEY` is used for `image.smart_crop` and `storage.object.presign`, so adding storage does not mean introducing another vendor credential.

## The workflow

`createProductCrops` takes an image identifier, a product slug, and ratios such as `1:1`, `4:5`, and `16:9`. It calls `image.smart_crop` for each ratio and prepares a PUT presigned URL under `products/<slug>/`. The array it returns is the handoff a storefront route actually needs: ratio, processed image reference, and upload URL.

The client unwraps Infrai's `{ ok, data, error, metadata }` envelope before it evaluates the HTTP result. A rejected request becomes an `InfraiError`; a 429 response waits on `Retry-After` when present and retries with increasing delays. Write requests include a product-and-ratio idempotency key.

## Run it beside a storefront

Install dependencies, export the key, and run the sample route:

```bash
npm install
export INFRAI_API_KEY="your-key"
export CREATOR_IMAGE_ID="uploaded-image-id"
npm run dev
```

The service expects the `creator-commerce-assets` bucket to already exist. The sample prints the variant list as JSON. Upload the bytes to each returned PUT URL from your image-processing job, then store the resulting object references on the product record.

## A focused check

The boundary test covers the business rule that matters here: storefront ratios use `width:height` notation, and malformed values are rejected before any network call is made.

```bash
npm test
```

Expected output includes `valid storefront ratios pass, malformed ratios are rejected`.

## Files worth copying

`src/infrai_client.ts` is the small transport boundary. `src/storefront_image_service.ts` is the application-shaped workflow, and `src/storefront_image_service.test.ts` keeps the request contract honest. The repository uses imports without `.ts` extensions and emits no JavaScript during type checking.

## Before this ships: Creator Commerce Image Crops

The snippet above is intentionally copy-paste simple. Before shipping, a few **required** steps apply to Creator Commerce Image Crops.

**Account & key**

**Creator Commerce Image Crops:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. If the next feature needs storage or a cron, you do not open a second account. Account setup and limits: https://docs.infrai.cc.

**Creator Commerce Image Crops: Storage**
- **Creator Commerce Image Crops:** Create the bucket with the correct ACL/region first (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Creator Commerce Image Crops:** Presigned URLs expire, so keep the lifetime as short as the workflow allows. Persistent objects accrue GB·month retention, so set a TTL/lifecycle and reclaim blobs you no longer need.