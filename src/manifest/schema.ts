import { z } from 'zod';

const AssetTypeEnum = z.enum(['mcp', 'skill', 'prompt', 'command', 'subAgent']);

export const AssetDescriptorSchema = z.object({
  type: AssetTypeEnum,
  source: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
});

export const ManifestSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/, {
    message: 'Manifest name must match namespace/pack-name format',
  }),
  assets: z.array(AssetDescriptorSchema).min(1),
});

export type AssetDescriptor = z.infer<typeof AssetDescriptorSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
