import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs"; // File System

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFIlePath) => {
  try {
    if (!localFIlePath) {
      return null;
    }
    //Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFIlePath, {
      resource_type: "auto",
    });
    //File has been uploaded successfully
    console.log("File has uploaded successully on cloudinary", response);
    return response;
  } catch (error) {
    fs.unlinkSync(localFIlePath); //Removes the locally saved temporary file as the upload got failed
    return null;
  }
};

export { uploadOnCloudinary };
