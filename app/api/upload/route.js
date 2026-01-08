import { NextResponse } from 'next/server';
import cloudinary from '@/lib/utils/cloudinary';
import { verifyAuth } from '@/lib/auth-helpers';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '@/config/config';

// Helper function to configure Cloudinary for serverless environments
function configureCloudinary() {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function POST(request) {
  try {
    // Configure Cloudinary for this serverless function
    configureCloudinary();
    
    // Check authentication
    const authResult = await verifyAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }
    
    const uploadPromises = files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      return new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'stock-flow' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        
        // Write the buffer to the upload stream
        upload_stream.end(buffer);
      });
    });
    
    const urls = await Promise.all(uploadPromises);
    
    return NextResponse.json({ success: true, urls });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Configure Cloudinary for this serverless function
    configureCloudinary();
    
    // Check authentication
    const authResult = await verifyAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url, `http://${request.headers.get('host')}`);
    const fileUrl = searchParams.get('fileUrl') || (await request.json()).fileUrl;
    
    if (!fileUrl) {
      return NextResponse.json({ success: false, error: 'File URL is required' }, { status: 400 });
    }
    
    // Extract public ID from URL
    const publicId = extractPublicIdFromUrl(fileUrl);
    if (!publicId) {
      return NextResponse.json({ success: false, error: 'Invalid file URL' }, { status: 400 });
    }
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to delete file from Cloudinary' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/');
    
    // Find the part after 'upload' which contains the public ID
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex !== -1 && pathParts.length > uploadIndex + 1) {
      // The public ID is the last part after the image type (e.g., v123456/image.jpg -> image)
      const imagePart = pathParts[pathParts.length - 1];
      const publicId = imagePart.includes('.') ? imagePart.split('.')[0] : imagePart;
      return publicId;
    }
    
    // Alternative: extract from the end of the URL
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const publicId = lastPart.includes('.') ? lastPart.split('.')[0] : lastPart;
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}
