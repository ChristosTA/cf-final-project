const path = require('path');
const multer = require('multer');

const STORAGE = process.env.STORAGE || 'local';

function localStorage() {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const storage = multer.diskStorage({
        destination: path.join(__dirname, '..', '..', uploadDir),
        filename: (_req, file, cb) => {
            const ts = Date.now();
            const ext = path.extname(file.originalname || '');
            cb(null, `${ts}-${Math.random().toString(36).slice(2)}${ext}`);
        }
    });
    return {
        multerStorage: storage,
        mapFile: f => ({
            provider: 'local',
            url: `/uploads/${path.basename(f.path)}`, // ΠΟΤΕ absolute path
            key: path.basename(f.path),
        }),
        cloudinary: null
    };
}

function cloudinaryStorage() {
    const { v2: cloudinary } = require('cloudinary');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ secure: true }); // διαβάζει από CLOUDINARY_URL
    } else {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key:    process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
    }

    const storage = new CloudinaryStorage({
        cloudinary,
        params: { folder: 'marketplace', resource_type: 'image' }
    });

    return {
        multerStorage: storage,
        mapFile: f => ({
            provider: 'cloudinary',
            url: f.path,       // secure_url από Cloudinary
            key: f.filename,   // public_id
        }),
        cloudinary
    };
}

module.exports = function getStorage() {
    return STORAGE === 'cloudinary' ? cloudinaryStorage() : localStorage();
};
