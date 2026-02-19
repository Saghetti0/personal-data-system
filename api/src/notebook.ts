import { filterNotes } from "./filter";
import { compareNotes } from "./ordering";
import { generateSnowflake } from "./snowflake";
import { Attachment, AttachmentId, Feed, FeedId, Filter, Immutable, Note, NoteId, OplogEntry, OplogObjectType, Snowflake, Tag, TagId } from "@waltermin/pds-shared";
import { Database } from "./db";
import { Logger } from "pino";

// NOTE: despite many methods being fully synchronous, the signatures are async
// for flexibility and future expansion

// XXX: only instantiate one instance of notebook!
export class Notebook {
  private feeds: Map<FeedId, Immutable<Feed>> = new Map();
  private notes: Map<NoteId, Immutable<Note>> = new Map();
  private tags: Map<TagId, Immutable<Tag>> = new Map();
  private attachments: Map<AttachmentId, Immutable<Attachment>> = new Map();
  private readonly logger: Logger;

  constructor(logger: Logger, private readonly db: Database) {
    this.logger = logger.child({ module: "notebook" });
  }

  /// Read notebook contents from DB
  async initialize() {
    const data = await this.db.getAllCurrentObjects();

    for (const obj of data) {
      switch (obj.type) {
        case OplogObjectType.Note:
          this.notes.set(obj.id, obj.data as Immutable<Note>);
          break;
        case OplogObjectType.Feed:
          this.feeds.set(obj.id, obj.data as Immutable<Feed>);
          break;
        case OplogObjectType.Tag:
          this.tags.set(obj.id, obj.data as Immutable<Tag>);
          break;
        case OplogObjectType.Attachment:
          this.attachments.set(obj.id, obj.data as Immutable<Attachment>);
          break;
      }
    }

    this.logger.info(`loaded ${data.length} persisted objects`);
  }

  /*
   * Notes
   */

  /// Get a list of all notes in this notebook
  async getNotes(): Promise<Immutable<Note>[]> {
    return Array.from(this.notes.values());
  }

  /// Filter all the notes in this notebook
  async filterNotes(filter: Immutable<Filter>): Promise<Immutable<Note>[]> {
    return filterNotes(await this.getNotes(), filter);
  }

  /// Get a note by ID
  async getNote(noteId: NoteId): Promise<Immutable<Note> | null> {
    return this.notes.get(noteId) ?? null;
  }

  /// Upsert a note into the notebook
  async putNote(note: Immutable<Note>) {
    await this.oplogWrite(OplogObjectType.Note, note.id, note);
    await this.db.writeCurrentObject(note.id, OplogObjectType.Note, note);

    this.notes.set(note.id, note);
  }

  /// Delete a note by ID
  async deleteNote(noteId: NoteId) {
    await this.oplogWrite(OplogObjectType.Note, noteId, null);
    await this.db.deleteCurrentObject(noteId);

    this.notes.delete(noteId);
  }

  /*
   * Feeds
   */

  /// Get a list of all feeds in this notebook
  async getFeeds(): Promise<Immutable<Feed>[]> {
    return Array.from(this.feeds.values());
  }

  /// Get a feed by ID
  async getFeed(feedId: FeedId): Promise<Immutable<Feed> | null> {
    return this.feeds.get(feedId) ?? null;
  }

  /// Get all the notes inside a feed. Returns null if the feed could not be found.
  async getFeedContents(feedId: FeedId): Promise<Immutable<Note>[] | null> {
    // TODO: we could heavily optimize this by precomputing and caching

    const feed = await this.getFeed(feedId);
    if (feed === null) return null;

    return (await this.filterNotes(feed.filter))
      .toSorted((a, b) => compareNotes(a, b, feed.ordering));
  }

  /// Upsert a feed into the notebook
  async putFeed(feed: Immutable<Feed>) {
    await this.oplogWrite(OplogObjectType.Feed, feed.id, feed);
    await this.db.writeCurrentObject(feed.id, OplogObjectType.Feed, feed);

    this.feeds.set(feed.id, feed);
  }

  /// Delete a feed by ID
  async deleteFeed(feedId: FeedId) {
    await this.oplogWrite(OplogObjectType.Feed, feedId, null);
    await this.db.deleteCurrentObject(feedId);

    this.feeds.delete(feedId);
  }

  /*
   * Tags
   */

  /// Get a list of all tags in this notebook
  async getTags(): Promise<Immutable<Tag>[]> {
    return Array.from(this.tags.values());
  }

  /// Get a tag by ID
  async getTag(tagId: TagId): Promise<Immutable<Tag> | null> {
    return this.tags.get(tagId) ?? null;
  }

  /// Upsert a tag into the notebook
  async putTag(tag: Immutable<Tag>) {
    await this.oplogWrite(OplogObjectType.Tag, tag.id, tag);
    await this.db.writeCurrentObject(tag.id, OplogObjectType.Tag, tag);
    
    this.tags.set(tag.id, tag);
  }

  /// Delete a tag by ID
  async deleteTag(tagId: TagId) {
    await this.oplogWrite(OplogObjectType.Tag, tagId, null);
    await this.db.deleteCurrentObject(tagId);

    this.tags.delete(tagId);
  }

  /*
   * Attachments
   */

  /// Get a list of all attachments in this notebook
  async getAttachments(): Promise<Immutable<Attachment>[]> {
    return Array.from(this.attachments.values());
  }

  /// Get an attachment by ID
  async getAttachment(attachmentId: AttachmentId): Promise<Immutable<Attachment> | null> {
    return this.attachments.get(attachmentId) ?? null;
  }

  /// Upsert an attachment into the notebook
  async putAttachment(attachment: Immutable<Attachment>) {
    await this.oplogWrite(OplogObjectType.Attachment, attachment.id, attachment);
    await this.db.writeCurrentObject(attachment.id, OplogObjectType.Attachment, attachment);
    
    this.attachments.set(attachment.id, attachment);
  }

  /// Delete an attachment by ID
  async deleteAttachment(attachmentId: AttachmentId) {
    await this.oplogWrite(OplogObjectType.Attachment, attachmentId, null);
    await this.db.deleteCurrentObject(attachmentId);
    
    this.attachments.delete(attachmentId);
  }

  /*
   * Hooks
   */
  
  // TODO: add hooks!

  /*
   * Oplog internals
   */

  /// Write an oplog entry to persistent storage.
  private async oplogWrite(objType: OplogObjectType, objId: Snowflake, objData: object | null) {
    const entry: Immutable<OplogEntry> = {
      id: generateSnowflake(),
      obj_id: objId,
      obj_type: objType,
      data: objData
    };

    await this.db.writeOplogEntry(entry);
  }
}
