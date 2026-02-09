const cloudinary = require("cloudinary").v2;

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "users";


cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const uploadImageBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

/**
 * Extract public_id from a Cloudinary URL and delete the image.
 * e.g. https://res.cloudinary.com/xxx/image/upload/v123/cars/photo_123.jpg → cars/photo_123
 */
const deleteImageByUrl = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) return;

  try {
    // Extract the public_id from the URL
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{filename}.{ext}
    const parts = imageUrl.split("/upload/");
    if (parts.length < 2) return;

    // Remove the version prefix (v123456789/) and file extension
    const pathAfterUpload = parts[1];
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "");

    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted old image from Cloudinary: ${publicId}`);
  } catch (error) {
    // Log but don't throw — old image cleanup is not critical
    console.error("Failed to delete old image from Cloudinary:", error.message);
  }
};

module.exports = {
  uploadImageBuffer,
  deleteImageByUrl,
};
