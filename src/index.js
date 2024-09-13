import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});
// const app = express();

connectDB();
/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
  } catch (error) {
    console.log("ERROR: ", error);
  }
})(); // ; before the function so that if there is no semicolon on the line before it does not cause problems

*/
