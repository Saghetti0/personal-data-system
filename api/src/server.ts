import Fastify from "fastify";
import { Notebook } from "./notebook";
import { noteRoutes } from "./routes/notes";
import { feedRoutes } from "./routes/feeds";
import { tagRoutes } from "./routes/tags";
import { attachmentRoutes } from "./routes/attachments";

// TODO: initialize the notebook in a more sophisticated way than this
const notebook = new Notebook();

export async function startServer(port = 3000, host = "127.0.0.1") {
  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    },
  });

  await app.register(noteRoutes, { notebook });
  await app.register(feedRoutes, { notebook });
  await app.register(tagRoutes, { notebook });
  await app.register(attachmentRoutes, { notebook });

  await app.listen({ port, host });
  return app;
}
