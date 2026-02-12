import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function extractTextFromFile(filePath, mimeType) {
  if (mimeType === PDF_MIME) {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    const text = docs.map((d) => d.pageContent).join('\n\n');
    return text;
  }

  if (mimeType === DOCX_MIME) {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export async function chunkText(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  });

  const docs = await splitter.createDocuments([text]);

  return docs.map((doc, idx) => ({
    text: doc.pageContent,
    metadata: {
      ...doc.metadata,
      chunkIndex: idx
    }
  }));
}

export function getUploadsDir() {
  return path.join(__dirname, '..', 'uploads');
}

