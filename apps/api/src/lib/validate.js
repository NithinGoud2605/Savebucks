import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

export const postDealSchema = z.object({
  title: z.string().min(6).max(160),
  url: z.string().url(),
  price: z.number().positive().max(100000).nullable().optional(),
  merchant: z.string().min(2).max(80).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  image_url: z.string().url().nullable().optional()
});

export const voteSchema = z.object({ value: z.enum([z.literal(1), z.literal(-1)]) });

export const commentSchema = z.object({
  body: z.string().min(1).max(1000),
  parent_id: z.number().int().positive().nullable().optional()
});

export function cleanText(s) {
  if (s == null) return s;
  return sanitizeHtml(String(s), { allowedTags: [], allowedAttributes: {} }).trim();
}
