import { Attachment, Immutable, Note, Tag } from "@waltermin/pds-shared";
import { Notebook } from "./notebook";

// TODO: refactor to be more flexible? maybe in a v2 api
export type RelatedData = {
  tags: Tag[];
  attachments: Attachment[];
};

/// A type that describes an API response that additional data "joined" to it
export type ApiResponse<T> = {
  data: T;
  related: RelatedData;
};

const EMPTY_RELATED: RelatedData = { tags: [], attachments: [] };

async function buildRelated(
  notebook: Notebook,
  tagIds: number[],
  attachmentIds: number[]
): Promise<RelatedData> {
  const uniqueTagIds = [...new Set(tagIds)];
  const uniqueAttachmentIds = [...new Set(attachmentIds)];

  const [tags, attachments] = await Promise.all([
    Promise.all(uniqueTagIds.map((id) => notebook.getTag(id))),
    Promise.all(uniqueAttachmentIds.map((id) => notebook.getAttachment(id))),
  ]);

  return {
    tags: tags.filter((t): t is Immutable<Tag> => t !== null),
    attachments: attachments.filter(
      (a): a is Immutable<Attachment> => a !== null
    ),
  };
}

export async function noteResponse(
  notebook: Notebook,
  note: Immutable<Note>
): Promise<ApiResponse<Immutable<Note>>> {
  const tagIds = note.fields.tags ?? [];
  const attachmentIds = note.fields.attachments ?? [];
  const related = await buildRelated(notebook, tagIds as number[], attachmentIds as number[]);
  return { data: note, related };
}

export async function notesResponse(
  notebook: Notebook,
  notes: Immutable<Note>[]
): Promise<ApiResponse<Immutable<Note>[]>> {
  const tagIds = notes.flatMap((n) => (n.fields.tags ?? []) as number[]);
  const attachmentIds = notes.flatMap(
    (n) => (n.fields.attachments ?? []) as number[]
  );
  const related = await buildRelated(notebook, tagIds, attachmentIds);
  return { data: notes, related };
}

export function simpleResponse<T>(data: T): ApiResponse<T> {
  return { data, related: EMPTY_RELATED };
}
