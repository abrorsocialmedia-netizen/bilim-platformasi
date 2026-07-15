import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET') as string;
    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      forcePathStyle: this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID') as string,
        secretAccessKey: this.config.get<string>(
          'S3_SECRET_ACCESS_KEY',
        ) as string,
      },
    });
  }

  /** Adminlar uchun: video/PDF yuklash uchun bevosita yozish havolasi. */
  async createUploadUrl(
    folder: 'videos' | 'materials' | 'certificates',
    filename: string,
    contentType: string,
  ) {
    const key = `${folder}/${randomUUID()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 300,
    });
    return { uploadUrl, key };
  }

  /** O'quvchilar uchun: qisqa muddatli, imzolangan ko'rish havolasi. */
  async createReadUrl(key: string, expiresInSeconds: number) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /** Server tomonidan generatsiya qilingan fayllarni (masalan, sertifikat PDF) yozish. */
  async putObject(
    folder: 'certificates',
    filename: string,
    body: Buffer,
    contentType: string,
  ) {
    const key = `${folder}/${randomUUID()}-${filename}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }
}
