import path from 'node:path';
import multer from 'multer';

const UPLOAD_DIR = process.env.AVATAR_UPLOAD_DIR || 'uploads/avatars';

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, UPLOAD_DIR);
	},
	filename: (req: any, file, cb) => {
		const userId = req.user?.id || 'anon';
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, `avatar-${userId}-${Date.now()}${ext}`);
	},
});

export const uploadAvatar = multer({
	storage,
	limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
	fileFilter: (_req, file, cb) => {
		const allowed = ['image/jpeg', 'image/png', 'image/webp'];
		if (allowed.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
		}
	},
});