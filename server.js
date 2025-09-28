import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 4000;

const start = async () => {
  //await connectDB(process.env.MONGODB_URI);
   await connectDB("mongodb+srv://sourabh:sourabh123@localcluster0.0ri1ozc.mongodb.net/?retryWrites=true&w=majority&appName=LocalCLuster0");
  app.listen(PORT, () => console.log(`Running Server on http://localhost:${PORT}`));
};

start().catch((e) => {
  console.error("Failed to start", e);
  process.exit(1);
});

