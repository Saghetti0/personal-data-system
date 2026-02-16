import { FastifyInstance } from "fastify";
import { generateSnowflake } from "../snowflake";
import { Notebook } from "../notebook";
import { NoteCreateSchema, NoteUpdateSchema, FilterSchema } from "../schema";
import { noteResponse, notesResponse } from "../response";

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isFinite(n) ? n : null;
}

export async function noteRoutes(
  app: FastifyInstance,
  { notebook }: { notebook: Notebook }
) {
  // GET /notes
  app.get("/notes", async (_request, reply) => {
    const notes = await notebook.getNotes();
    return reply.send(await notesResponse(notebook, notes));
  });

  // POST /notes/search - search for notes using a filter
  // must be registered before /notes/:id
  app.post("/notes/search", async (request, reply) => {
    const result = FilterSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.format() });
    }
    const notes = await notebook.filterNotes(result.data);
    return reply.send(await notesResponse(notebook, notes));
  });

  // GET /notes/:id
  app.get<{ Params: { id: string } }>("/notes/:id", async (request, reply) => {
    const id = parseId(request.params.id);
    if (id === null) return reply.status(400).send({ error: "Invalid id" });

    const note = await notebook.getNote(id);
    if (note === null) return reply.status(404).send({ error: "Note not found" });

    return reply.send(await noteResponse(notebook, note));
  });

  // POST /notes - create new note
  app.post("/notes", async (request, reply) => {
    const result = NoteCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.format() });
    }

    const now = new Date().toISOString();
    const note = {
      id: generateSnowflake(),
      fields: result.data.fields,
      created_at: now,
      last_modified_at: now,
    };

    await notebook.putNote(note);
    return reply.status(201).send(await noteResponse(notebook, note));
  });

  // PUT /notes/:id - update existing note
  app.put<{ Params: { id: string } }>("/notes/:id", async (request, reply) => {
    const id = parseId(request.params.id);
    if (id === null) return reply.status(400).send({ error: "Invalid id" });

    const result = NoteUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.format() });
    }

    if (result.data.id !== id) {
      return reply.status(400).send({ error: "Body id does not match URL id" });
    }

    const existing = await notebook.getNote(id);
    if (existing === null) return reply.status(404).send({ error: "Note not found" });

    const note = {
      ...result.data,
      last_modified_at: new Date().toISOString(),
    };

    await notebook.putNote(note);
    return reply.send(await noteResponse(notebook, note));
  });

  // DELETE /notes/:id
  app.delete<{ Params: { id: string } }>(
    "/notes/:id",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const existing = await notebook.getNote(id);
      if (existing === null) return reply.status(404).send({ error: "Note not found" });

      await notebook.deleteNote(id);
      return reply.status(204).send();
    }
  );
}
