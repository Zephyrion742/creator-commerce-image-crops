import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

export const cropRequest = z.object({
  image: z.string().min(1),
  productSlug: z.string().min(1),
  aspects: z.array(z.string().regex(/^\d+:\d+$/)).min(1).max(4)
});

export type CropRequest = z.infer<typeof cropRequest>;
export type CropVariant = { aspect: string; image: string; downloadUrl?: string };
const cropCapability = "image.smart_crop";

export async function createProductCrops(input: unknown, client = new InfraiClient()): Promise<CropVariant[]> {
  const request = cropRequest.parse(input);
  const variants: CropVariant[] = [];
  for (const aspect of request.aspects) {
    const cropped = await client.request<{ image?: string; id?: string }>("/v1/image/smart_crop", {
      method: "POST",
      body: { image: request.image, aspect }
    });
    const objectKey = `products/${request.productSlug}/${aspect.replace(":", "x")}.jpg`;
    const presign = await client.request<{ url: string }>(`/v1/storage/object/presign/creator-commerce-assets/${encodeURIComponent(objectKey)}`, {
      method: "POST",
      body: { op: "put", expires_seconds: 900, content_type: "image/jpeg", idempotency_key: `${request.productSlug}-${aspect}` }
    });
    variants.push({ aspect, image: cropped.image ?? cropped.id ?? request.image, downloadUrl: presign.url });
  }
  return variants;
}

if (process.argv[1]?.endsWith("storefront_image_service.ts")) {
  const input = { image: process.env.CREATOR_IMAGE_ID ?? "image-example", productSlug: "linen-shirt", aspects: ["1:1", "4:5", "16:9"] };
  createProductCrops(input).then((variants) => console.log(JSON.stringify({ product: input.productSlug, variants }, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
