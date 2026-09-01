import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './paths';

const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

export function resolveAttachmentsRoot(): string {
  const root = app.isPackaged
    ? path.join(app.getPath('userData'), 'course-attachments')
    : path.join(resolveProjectRoot(), 'database', 'course-attachments');

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  return root;
}

export function resolveAttachmentFilePath(storageKey: string): string {
  return path.join(resolveAttachmentsRoot(), storageKey);
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export function buildStorageKey(courseId: string, attachmentId: string, fileName: string): string {
  return path.join(courseId, `${attachmentId}_${sanitizeFileName(fileName)}`);
}

export function saveAttachmentFile(sourcePath: string, storageKey: string): void {
  const targetPath = resolveAttachmentFilePath(storageKey);
  const targetDir = path.dirname(targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const stats = fs.statSync(sourcePath);
  if (stats.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error('Arquivo excede o limite de 25 MB.');
  }

  fs.copyFileSync(sourcePath, targetPath);
}

export function deleteAttachmentFile(storageKey: string): void {
  const filePath = resolveAttachmentFilePath(storageKey);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function deleteCourseAttachmentFolder(courseId: string): void {
  const courseDir = path.join(resolveAttachmentsRoot(), courseId);
  if (fs.existsSync(courseDir)) {
    fs.rmSync(courseDir, { recursive: true, force: true });
  }
}

export function readAttachmentAsDataUrl(storageKey: string, mimeType: string): string {
  const filePath = resolveAttachmentFilePath(storageKey);
  if (!fs.existsSync(filePath)) {
    throw new Error('Arquivo anexo não encontrado.');
  }

  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export function listAllAttachmentFiles(): Array<{ storageKey: string; absolutePath: string }> {
  const root = resolveAttachmentsRoot();
  const results: Array<{ storageKey: string; absolutePath: string }> = [];

  if (!fs.existsSync(root)) {
    return results;
  }

  const walk = (currentDir: string) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const storageKey = path.relative(root, absolutePath);
      results.push({ storageKey, absolutePath });
    }
  };

  walk(root);
  return results;
}

export function restoreAttachmentFile(storageKey: string, buffer: Buffer): void {
  const targetPath = resolveAttachmentFilePath(storageKey);
  const targetDir = path.dirname(targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, buffer);
}

export const ATTACHMENTS_ZIP_PREFIX = 'attachments/';
