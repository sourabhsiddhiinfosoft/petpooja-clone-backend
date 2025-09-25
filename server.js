import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => console.log(`Running Server on http://localhost:${PORT}`));
};

start().catch((e) => {
  console.error("Failed to start", e);
  process.exit(1);
});

