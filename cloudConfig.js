const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const postImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "Airbnb/Posts",
        allowedFormats: ["png", "jpeg", "jpg"], // Corrected property name
    },
});

const userPicStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "Airbnb/User",
        allowedFormats: ["png", "jpeg", "jpg"], // Corrected property name
    },
});

module.exports = {
    cloudinary,
    postImageStorage,
    userPicStorage,
};
