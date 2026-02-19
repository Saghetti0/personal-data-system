/*
 * Core datatypes for PDS. All of these types are designed to be trivially
 * serializable into JSON. We use type aliases in order to communicate richer
 * information about types, without rigidly specifying them.
 */

// utility

type ImmutableObject<T> = {
  readonly [K in keyof T]: Immutable<T[K]>;
}

export type Immutable<T> = {
  readonly [K in keyof T]: T[K] extends Function ? T[K] : ImmutableObject<T[K]>;
}

export type Snowflake = number
export type Markdown = string;
export type MimeType = string;
export type Location = {
  lat: number;
  lon: number;
};

/// A UTC ISO timestamp in string form
export type IsoTimestamp = string;
/// A timezone name, as defined in the standard tz database
export type Timezone = string;

/// How precise a When is
export enum WhenPrecision {
  Date = "date",
  DateTime = "date_time",
  DateTimeSeconds = "date_time_seconds",
}

/// A timestamp that includes additional semantic information.
export type When = {
  timestamp: IsoTimestamp;
  // What precision this timestamp should have when rendered.
  precision: WhenPrecision;
  // The timezone that this When is associated with. Note that the timestamp field is always UTC.
  timezone?: Timezone;
};

export type TagId = Snowflake;
export type Tag = {
  id: TagId;
  /// The name of the tag. Consists of alphanumeric characters, dashes, and slashes for components.
  name: string;
};

export type AttachmentId = Snowflake;
/// An attachment on a note. This object only describes the metadata, contents
/// for an attachment are available through a separate API endpoint.
export type Attachment = {
  id: AttachmentId;
  /// The SHA256 hash of this attachment
  hash: string;
  /// The original filename of this attachment
  filename: string | null;
  /// The MIME type of this attachment
  content_type: MimeType;
  /// The width of this attachment, in pixels
  width: number | null;
  /// The height of this attachment, in pixels
  height: number | null;
  /// The duration of this attachment, in seconds
  duration: number | null;
};

export type NoteFields = Partial<{
  title: string;
  body: Markdown;
  tags: TagId[];
  when: When;
  location: Location;
  attachments: AttachmentId[];
}>;

export type NoteId = Snowflake;
export type Note = {
  id: NoteId;
  fields: NoteFields;
  created_at: IsoTimestamp;
  last_modified_at: IsoTimestamp;
};

/*
 * === Filters ===
 */

export enum FilterType {
  Anything = "anything",
  And = "and",
  Or = "or",
  Not = "not",
  HasFields = "has_fields",
  TagsInclude = "tags_include",
  TextMatch = "text_match",
  TimeRange = "time_range",
  LocationNear = "location_near",
};

/// Always passes
export type FilterAnything = {
  op: FilterType.Anything;
  d: null;
};

/// Passes if all of the specified filters pass
export type FilterAnd = {
  op: FilterType.And;
  d: Filter[];
};

/// Passes if any of the specified filters pass
export type FilterOr = {
  op: FilterType.Or;
  d: Filter[];
};

/// Passes only if the specified filter doesn't pass
export type FilterNot = {
  op: FilterType.Not;
  d: Filter;
};

/// Passes if all of the specified fields exist on a note
export type FilterHasFields = {
  op: FilterType.HasFields;
  d: (keyof NoteFields)[];
};

/// Passes if the note contains all of the specfified tags
export type FilterTagsInclude = {
  op: FilterType.TagsInclude;
  d: TagId[];
};

export enum TextMatchRule {
  /// Start matching from the left side of the string
  Left = "left",
  /// Match anywhere in the string, as long as it's contiguous
  Contains = "contains",
  // TODO: maybe fulltext/tokenized?
}

/// Passes if the specified field matches text based on a rule
export type FilterTextMatch = {
  op: FilterType.TextMatch;
  d: {
    /// The field to match the text against
    field: "title" | "body";
    /// The method to match the text with
    mode: TextMatchRule;
    /// The text to match
    text: string;
  };
};

/// Passes if the note's "when" falls within a range
export type FilterTimeRange = {
  op: FilterType.TimeRange;
  d: {
    before?: IsoTimestamp | undefined;
    after?: IsoTimestamp | undefined;
  }
};

/// Passes if the note's location is within a certain radius of a point
export type FilterLocationNear = {
  op: FilterType.LocationNear;
  d: {
    /// The point to compare the location to
    loc: Location;
    /// Maximum distance from this point, in kilometers
    km: number;
  }
};

export type Filter =
  FilterAnything |
  FilterAnd |
  FilterOr |
  FilterNot |
  FilterHasFields |
  FilterTagsInclude |
  FilterTextMatch |
  FilterTimeRange |
  FilterLocationNear;

/*
 * === Feeds ===
 */

export type OrderableField = "title" | "body" | "when";
export enum OrderingDirection {
  Ascending = "asc",
  Descending = "desc",
};
export type OrderingComponent = {
  field: OrderableField;
  direction: OrderingDirection;
};
export type Ordering = OrderingComponent[];

export enum FeedOrigin {
  Start = "start",
  End = "end",
}

export type FeedId = Snowflake;
/// A dynamic list of notes
export type Feed = {
  id: FeedId;
  name: string;
  filter: Filter;
  /// If opening the feed should bring you to the start or the end by default
  /// Ex: a timeline might be End, and a task list might be Start
  origin: FeedOrigin;
  /// The fields that notes in this feed should be ordered by
  ordering: Ordering;
};

/*
 * === Oplog ==
 * A log of all write operations to objects in the notebook.
 */

export enum OplogObjectType {
  Note = "note",
  Tag = "tag",
  Feed = "feed",
  Attachment = "attachment",
}

export type OplogEntryId = Snowflake;
export type OplogEntry = {
  /// The ID of this oplog entry
  id: OplogEntryId;
  /// The ID of the object described in this log
  obj_id: Snowflake;
  /// The type of the object described in this log
  obj_type: OplogObjectType;

  /// The data for the object, or null if it was deleted.
  data: object | null; // crappy types are fine, for now (until we need to read oplog)
};
