import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private notifications: NotificationsService,
  ) {}

  private generateCertNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `CERT-${year}-${random}`;
  }

  private async renderPdf(params: {
    fullName: string;
    courseTitle: string;
    certNumber: string;
    issuedAt: Date;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(30).text('SERTIFIKAT', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(16).text('Ushbu sertifikat quyidagi shaxsga beriladi:', {
        align: 'center',
      });
      doc.moveDown();
      doc.fontSize(24).text(params.fullName, { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(16)
        .text(
          `"${params.courseTitle}" kursini muvaffaqiyatli tugatgani uchun`,
          { align: 'center' },
        );
      doc.moveDown(2);
      doc
        .fontSize(12)
        .text(`Sertifikat raqami: ${params.certNumber}`, { align: 'center' });
      doc.text(
        `Berilgan sana: ${params.issuedAt.toLocaleDateString('uz-UZ')}`,
        { align: 'center' },
      );
      doc.end();
    });
  }

  async issueIfEligible(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course?.isCertified) return null;

    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const certNumber = this.generateCertNumber();
    const issuedAt = new Date();
    let pdfUrl: string | undefined;
    try {
      const pdfBuffer = await this.renderPdf({
        fullName: user.fullName,
        courseTitle: course.title,
        certNumber,
        issuedAt,
      });
      const key = await this.storage.putObject(
        'certificates',
        `${certNumber}.pdf`,
        pdfBuffer,
        'application/pdf',
      );
      pdfUrl = key;
    } catch (error) {
      this.logger.error(
        `Sertifikat PDF generatsiyasida xatolik: ${(error as Error).message}`,
      );
    }

    const certificate = await this.prisma.certificate.create({
      data: { userId, courseId, certNumber, issuedAt, pdfUrl },
    });

    await this.notifications.create(
      userId,
      'access_granted',
      `Tabriklaymiz! "${course.title}" kursi uchun sertifikatingiz tayyor (№ ${certNumber}).`,
    );

    return certificate;
  }

  async myCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
