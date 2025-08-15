const multer = require('multer');
const getStorage = require('../config/storage');

const { multerStorage } = getStorage();

const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB / έως 5 αρχεία
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            const err = new Error('Only image files are allowed');
            err.status = 415; // Unsupported Media Type
            return cb(err);
        }
        cb(null, true);
    },
});

module.exports = upload;
