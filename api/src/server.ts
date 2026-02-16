import Fastify from "fastify";
import { Notebook } from "./notebook";
import { noteRoutes } from "./routes/notes";
import { feedRoutes } from "./routes/feeds";
import { tagRoutes } from "./routes/tags";
import { attachmentRoutes } from "./routes/attachments";
import { Database } from "./db";
import pino from "pino";
import { complain } from "./util";

export async function startServer(port = 3000, host = "127.0.0.1") {
  const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    transport: {
      target: "pino-pretty",
      options: {
        messageFormat: "{if module}{module}{end}{if source}.{source}{end}: {msg}",
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname,module,source",
      },
    },
  });

  const fastifyLogger = logger.child({ module: "http" });

  const database = new Database(process.env.MYSQL_URL ?? complain("MYSQL_URL is not set"));

  const notebook = new Notebook(logger, database);
  await notebook.initialize();
  
  const app = Fastify({ loggerInstance: fastifyLogger });

  await app.register(noteRoutes, { notebook });
  await app.register(feedRoutes, { notebook });
  await app.register(tagRoutes, { notebook });
  await app.register(attachmentRoutes, { notebook });

  await app.listen({ port, host });
  return app;
}
