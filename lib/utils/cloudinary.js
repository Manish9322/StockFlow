import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '@/config/config';

// Configure Cloudinary with your credentials from config file
cloudinary.config({ 
  cloud_name: CLOUDINARY_CLOUD_NAME, 
  api_key: CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

export default cloudinary;