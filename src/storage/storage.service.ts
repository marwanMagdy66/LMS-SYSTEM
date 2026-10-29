
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { v2 as cloudinary } from 'cloudinary';
  
  @Injectable()
  export class StorageService {
    constructor() {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  
    async uploadVideo(
      file: Express.Multer.File,
      publicId: string,
    ) {
      if (!file) {
        throw new BadRequestException('Video file is required');
      }
  
      if (!file.mimetype.startsWith('video/')) {
        throw new BadRequestException('Only video files are allowed');
      }
  
      if (file.size > 100 * 1024 * 1024) {
        throw new BadRequestException(
          'Maximum video size is 100 MB',
        );
      }
  
      if (!publicId?.trim()) {
        throw new BadRequestException(
          'Video public ID is required',
        );
      }
  
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              public_id: publicId,
              asset_folder: publicId.substring(0, publicId.lastIndexOf('/')),
              overwrite: false,
              unique_filename: false,
            },
            (error, uploadedFile) => {
              if (error) {
                return reject(error);
              }
  
              if (!uploadedFile) {
                return reject(
                  new Error('Cloudinary returned no upload result'),
                );
              }
  
              resolve(uploadedFile);
            },
          );
  
          stream.end(file.buffer);
        });
  
        return {
          publicId: result.public_id,
          secureUrl: result.secure_url,
          duration: result.duration,
          format: result.format,
        };
      } catch {
        throw new InternalServerErrorException(
          'Video upload failed',
        );
      }
    }
  
    async deleteVideo(publicId: string) {
      if (!publicId?.trim()) {
        throw new BadRequestException(
          'Video public ID is required',
        );
      }
  
      try {
        const result = await cloudinary.uploader.destroy(
          publicId,
          {
            resource_type: 'video',
            invalidate: true,
          },
        );
  
        if (
          result.result !== 'ok' &&
          result.result !== 'not found'
        ) {
          throw new Error(
            'Cloudinary failed to delete the video',
          );
        }
  
        return {
          message: 'Video deletion completed',
          result: result.result,
        };
      } catch {
        throw new InternalServerErrorException(
          'Failed to delete video from Cloudinary',
        );
      }
    }
  }
  