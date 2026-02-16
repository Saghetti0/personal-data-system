import { startServer } from "./server";
import "dotenv/config";

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
