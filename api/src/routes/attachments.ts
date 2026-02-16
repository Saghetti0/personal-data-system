import { FastifyInstance } from "fastify";
import { generateSnowflake } from "../snowflake";
import { Notebook } from "../notebook";
import { AttachmentCreateSchema, AttachmentSchema } from "../schema";
import { simpleResponse } from "../response";

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isFinite(n) ? n : null;
}

export async function attachmentRoutes(
  app: FastifyInstance,
  { notebook }: { notebook: Notebook }
) {
  // GET /attachments
  app.get("/attachments", async (_request, reply) => {
    const attachments = await notebook.getAttachments();
    return reply.send(simpleResponse(attachments));
  });

  // GET /attachments/:id
  app.get<{ Params: { id: string } }>(
    "/attachments/:id",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const attachment = await notebook.getAttachment(id);
      if (attachment === null)
        return reply.status(404).send({ error: "Attachment not found" });

      return reply.send(simpleResponse(attachment));
    }
  );

  // POST /attachments - create new attachment
  app.post("/attachments", async (request, reply) => {
    const result = AttachmentCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.format() });
    }

    const attachment = { id: generateSnowflake(), ...result.data };
    await notebook.putAttachment(attachment);
    return reply.status(201).send(simpleResponse(attachment));
  });

  // PUT /attachments/:id - update existing attachment
  app.put<{ Params: { id: string } }>(
    "/attachments/:id",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const result = AttachmentSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: result.error.format() });
      }

      if (result.data.id !== id) {
        return reply
          .status(400)
          .send({ error: "Body id does not match URL id" });
      }

      const existing = await notebook.getAttachment(id);
      if (existing === null)
        return reply.status(404).send({ error: "Attachment not found" });

      await notebook.putAttachment(result.data);
      return reply.send(simpleResponse(result.data));
    }
  );

  // DELETE /attachments/:id
  app.delete<{ Params: { id: string } }>(
    "/attachments/:id",
    async (request, reply) => {
      const id = parseId(request.params.id);
      if (id === null) return reply.status(400).send({ error: "Invalid id" });

      const existing = await notebook.getAttachment(id);
      if (existing === null)
        return reply.status(404).send({ error: "Attachment not found" });

      await notebook.deleteAttachment(id);
      return reply.status(204).send();
    }
  );
}
