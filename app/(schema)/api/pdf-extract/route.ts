import { auth } from '@/app/(auth)/auth';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from "langchain/document";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data with the PDF file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Get the file data
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    
    // Use PDFLoader to extract text
    const pdfLoader = new PDFLoader(blob);
    const docs = await pdfLoader.load();
    const extractedText = docs
      .map((doc: Document) => doc.pageContent)
      .join('\n\n');

    // Return the extracted text
    return NextResponse.json({ 
      text: extractedText,
      filename: file.name,
      size: extractedText.length
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from PDF' },
      { status: 500 }
    );
  }
}