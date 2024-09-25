import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});
// const app = express();

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("App Error", error);
    });
  })
  .catch((error) => console.log("MONGODB CONNECTION FAILED!", error));

/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
  } catch (error) {
    console.log("ERROR: ", error);
  }
})(); // ; before the function so that if there is no semicolon on the line before it does not cause problems

*/
