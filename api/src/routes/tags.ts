import { FastifyInstance } from "fastify";
import { generateSnowflake } from "../snowflake";
import { Notebook } from "../notebook";
import { TagCreateSchema, TagSchema } from "../schema";
import { simpleResponse } from "../response";

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isFinite(n) ? n : null;
}

export async function tagRoutes(
  app: FastifyInstance,
  { notebook }: { notebook: Notebook }
) {
  // GET /tags
  app.get("/tags", async (_request, reply) => {
    const tags = await notebook.getTags();
    return reply.send(simpleResponse(tags));
  });

  // GET /tags/:id
  app.get<{ Params: { id: string } }>("/tags/:id", async (request, reply) => {
    const id = parseId(request.params.id);
    if (id === null) return reply.status(400).send({ error: "Invalid id" });

    const tag = await notebook.getTag(id);
    if (tag === null) return reply.status(404).send({ error: "Tag not found" });

    return reply.send(simpleResponse(tag));
  });

  // POST /tags - create new tag
  app.post("/tags", async (request, reply) => {
    const result = TagCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.format() });
    }

    const tag = { id: generateSnowflake(), ...result.data };
    await notebook.putTag(tag);
    return reply.status(201).send(simpleResponse(tag));
  });

  // PUT /tags/:id - update existing tag
  app.put<{ Params: { id: string } }>("/tags/:id", async (request, reply) => {
    const id = parseId(request.params.id);
    if (id === null) return reply.status(400).send({ error: "Invalid id" });

    const result = TagSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.format() });
    }

    if (result.data.id !== id) {
      return reply.status(400).send({ error: "Body id does not match URL id" });
    }

    const existing = await notebook.getTag(id);
    if (existing === null) return reply.status(404).send({ error: "Tag not found" });

    await notebook.putTag(result.data);
    return reply.send(simpleResponse(result.data));
  });

  // DELETE /tags/:id
  app.delete<{ Params: { id: string } }>(
    "/tags/:id",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const existing = await notebook.getTag(id);
      if (existing === null) return reply.status(404).send({ error: "Tag not found" });

      await notebook.deleteTag(id);
      return reply.status(204).send();
    }
  );
}
