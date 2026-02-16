import { FastifyInstance } from "fastify";
import { generateSnowflake } from "../snowflake";
import { Notebook } from "../notebook";
import { FeedCreateSchema, FeedSchema } from "../schema";
import { notesResponse, simpleResponse } from "../response";

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isFinite(n) ? n : null;
}

export async function feedRoutes(
  app: FastifyInstance,
  { notebook }: { notebook: Notebook }
) {
  // GET /feeds
  app.get("/feeds", async (_request, reply) => {
    const feeds = await notebook.getFeeds();
    return reply.send(simpleResponse(feeds));
  });

  // GET /feeds/:id
  app.get<{ Params: { id: string } }>("/feeds/:id", async (request, reply) => {
    const id = parseId(request.params.id);
    if (id === null) return reply.status(400).send({ error: "Invalid id" });

    const feed = await notebook.getFeed(id);
    if (feed === null) return reply.status(404).send({ error: "Feed not found" });

    return reply.send(simpleResponse(feed));
  });

  // GET /feeds/:id/contents
  app.get<{ Params: { id: string } }>(
    "/feeds/:id/contents",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const notes = await notebook.getFeedContents(id);
      if (notes === null) return reply.status(404).send({ error: "Feed not found" });

      return reply.send(await notesResponse(notebook, notes));
    }
  );

  // POST /feeds - create new feed
  app.post("/feeds", async (request, reply) => {
    const result = FeedCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.format() });
    }

    const feed = { id: generateSnowflake(), ...result.data };
    await notebook.putFeed(feed);
    return reply.status(201).send(simpleResponse(feed));
  });

  // PUT /feeds/:id - update existing feed
  app.put<{ Params: { id: string } }>(
    "/feeds/:id",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const result = FeedSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: result.error.format() });
      }

      if (result.data.id !== id) {
        return reply.status(400).send({ error: "Body id does not match URL id" });
      }

      const existing = await notebook.getFeed(id);
      if (existing === null) return reply.status(404).send({ error: "Feed not found" });

      await notebook.putFeed(result.data);
      return reply.send(simpleResponse(result.data));
    }
  );

  // DELETE /feeds/:id
  app.delete<{ Params: { id: string } }>(
    "/feeds/:id",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const existing = await notebook.getFeed(id);
      if (existing === null) return reply.status(404).send({ error: "Feed not found" });

      await notebook.deleteFeed(id);
      return reply.status(204).send();
    }
  );
}
