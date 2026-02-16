import { z } from "zod";
import {
  Filter,
  FilterType,
  FeedOrigin,
  OrderingDirection,
  TextMatchRule,
  WhenPrecision,
} from "./types";

export const SnowflakeSchema = z.number().int();

export const LocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const WhenSchema = z.object({
  timestamp: z.string(),
  precision: z.nativeEnum(WhenPrecision),
  timezone: z.string().optional(),
});

export const TagSchema = z.object({
  id: SnowflakeSchema,
  name: z.string(),
});

export const TagCreateSchema = z.object({
  name: z.string(),
});

export const AttachmentSchema = z.object({
  id: SnowflakeSchema,
  hash: z.string(),
  filename: z.string().nullable(),
  content_type: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
});

export const AttachmentCreateSchema = AttachmentSchema.omit({ id: true });

export const NoteFieldsSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  tags: z.array(SnowflakeSchema).optional(),
  when: WhenSchema.optional(),
  location: LocationSchema.optional(),
  attachments: z.array(SnowflakeSchema).optional(),
});

export const NoteSchema = z.object({
  id: SnowflakeSchema,
  fields: NoteFieldsSchema,
  created_at: z.string(),
  last_modified_at: z.string(),
});

export const NoteCreateSchema = z.object({
  fields: NoteFieldsSchema,
});

// NoteUpdateSchema: full Note, same shape as NoteSchema, used for PUT
export const NoteUpdateSchema = NoteSchema;

// FilterSchema: uses z.lazy() to support recursive And/Or/Not variants
export const FilterSchema: z.ZodType<Filter> = z.lazy(() =>
  z.union([
    z.object({ op: z.literal(FilterType.Anything), d: z.null() }),
    z.object({ op: z.literal(FilterType.And), d: z.array(FilterSchema) }),
    z.object({ op: z.literal(FilterType.Or), d: z.array(FilterSchema) }),
    z.object({ op: z.literal(FilterType.Not), d: FilterSchema }),
    z.object({
      op: z.literal(FilterType.HasFields),
      d: z.array(
        z.enum(["title", "body", "tags", "when", "location", "attachments"])
      ),
    }),
    z.object({
      op: z.literal(FilterType.TagsInclude),
      d: z.array(SnowflakeSchema),
    }),
    z.object({
      op: z.literal(FilterType.TextMatch),
      d: z.object({
        field: z.enum(["title", "body"]),
        mode: z.nativeEnum(TextMatchRule),
        text: z.string(),
      }),
    }),
    z.object({
      op: z.literal(FilterType.TimeRange),
      d: z.object({
        before: z.string().optional(),
        after: z.string().optional(),
      }),
    }),
    z.object({
      op: z.literal(FilterType.LocationNear),
      d: z.object({
        loc: LocationSchema,
        km: z.number(),
      }),
    }),
  ])
);

export const OrderingComponentSchema = z.object({
  field: z.enum(["title", "body", "when"]),
  direction: z.nativeEnum(OrderingDirection),
});

export const OrderingSchema = z.array(OrderingComponentSchema);

export const FeedSchema = z.object({
  id: SnowflakeSchema,
  name: z.string(),
  filter: FilterSchema,
  origin: z.nativeEnum(FeedOrigin),
  ordering: OrderingSchema,
});

export const FeedCreateSchema = FeedSchema.omit({ id: true });
