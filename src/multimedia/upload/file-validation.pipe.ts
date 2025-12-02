import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

export const MAX_FILES = 10;
export const ID_DOC_MAX_FILES = 2;

@Injectable()
export class ImageFileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Image file is required');
    }

    const { mimetype, size } = value;
    const MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'The image should be either jpeg, png, heic or webp.',
      );
    }

    if (size > 5000000) {
      throw new BadRequestException(`File size should be at most 5MB`);
    }

    return value;
  }
}

@Injectable()
export class ImageFilesSizeValidationPipe implements PipeTransform {
  transform(value: Array<Express.Multer.File>, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Image file(s) is required');
    }

    if (value.length > MAX_FILES) {
      throw new BadRequestException(
        `Maximum of ${MAX_FILES} files can only be uploaded at once.`,
      );
    }

    for (let index = 0; index < value.length; index++) {
      const image = value[index];

      const { mimetype, size } = image;
      const MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ];
      if (!MIME_TYPES.includes(mimetype)) {
        throw new BadRequestException(
          'The image(s) should be either jpeg, png, or webp.',
        );
      }

      if (size > 15000000) {
        throw new BadRequestException(`File size should be at most 15MB`);
      }
    }

    return value;
  }
}

@Injectable()
export class VideoFileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Video file is required');
    }

    const { mimetype, size } = value;
    const MIME_TYPES = ['video/webm', 'video/mp4', 'video/mpeg'];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'The video should be either webm, mp4, or mpeg.',
      );
    }

    if (size > 100000000) {
      throw new BadRequestException(`File size should be at most 100MB`);
    }

    return value;
  }
}

@Injectable()
export class IdentityDocFileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Identity Document file(s) is required');
    }

    // if (value.length !== ID_DOC_MAX_FILES) {
    //   throw new BadRequestException(
    //     `Only ${ID_DOC_MAX_FILES} files can only be uploaded at once.`,
    //   );
    // }

    const { mimetype, size } = value;
    const MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'The image should be either jpeg, png, webp or pdf.',
      );
    }

    if (size > 15000000) {
      throw new BadRequestException(`File size should be at most 15MB`);
    }

    return value;
  }
}

@Injectable()
export class IdentityDocFilesSizeValidationPipe implements PipeTransform {
  transform(value: Array<Express.Multer.File>, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Identity Document file(s) is required');
    }

    // if (value.length !== ID_DOC_MAX_FILES) {
    //   throw new BadRequestException(
    //     `Only ${ID_DOC_MAX_FILES} files can only be uploaded at once.`,
    //   );
    // }

    for (let index = 0; index < value.length; index++) {
      const image = value[index];

      const { mimetype, size } = image;
      const MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf',
      ];
      if (!MIME_TYPES.includes(mimetype)) {
        throw new BadRequestException(
          'The image(s) should be either jpeg, png, webp or pdf.',
        );
      }

      if (size > 15000000) {
        throw new BadRequestException(`File size should be at most 15MB`);
      }
    }

    return value;
  }
}

@Injectable()
export class IdentityDocFileWithZipSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Identity Document file(s) is required');
    }

    // if (value.length !== ID_DOC_MAX_FILES) {
    //   throw new BadRequestException(
    //     `Only ${ID_DOC_MAX_FILES} files can only be uploaded at once.`,
    //   );
    // }

    const { mimetype, size } = value;
    const MIME_TYPES = ['application/zip'];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'The image should be either jpeg, png, webp pdf or zip.',
      );
    }

    if (size > 100000000) {
      throw new BadRequestException(`File size should be at most 100MB`);
    }

    return value;
  }
}
