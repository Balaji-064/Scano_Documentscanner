import { Component, ElementRef, ViewChild } from '@angular/core';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-docxto-pdf',
  standalone: true,
  imports: [],
  templateUrl: './docxto-pdf.component.html',
  styleUrls: ['./docxto-pdf.component.css'],
})
export class DocxtoPdfComponent {
  private pdfDoc: jsPDF | null = null;
  public previewContent: string | null = null;
  public totalPages: number = 0;
  public currentPage: number = 1;
  @ViewChild('previewContainer') previewContainer!: ElementRef;

  constructor() {}

  // Handle file selection and conversion from DOCX to HTML
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.docx')) {
      this.convertDocxToHtml(file);
    } else {
      alert('Please select a valid DOCX file');
    }
  }

  // Convert DOCX to HTML for preview
  convertDocxToHtml(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      mammoth
        .convertToHtml({ arrayBuffer })
        .then((result: any) => {
          this.previewContent = result.value;
          this.createPagination(result.value);
          const images = result.images;
          this.createPdf(result.value, images);
        })
        .catch((error: any) => {
          console.error('Error extracting DOCX content: ', error);
          alert('Error processing DOCX file');
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // Create PDF from HTML content
  createPdf(htmlContent: string, images: any): jsPDF {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const fontSize = 12;
    let verticalPosition = margin + fontSize;
    let currentPage = 1;

    doc.setFont('helvetica');
    doc.setFontSize(fontSize);

    // Convert HTML content into structured content (text and images)
    const content = this.convertHtmlToPdfContent(htmlContent);

    content.forEach((item) => {
      // Check if content overflows the page
      if (verticalPosition + fontSize * item.lines.length > pageHeight - margin) {
        this.addPageNumber(doc, currentPage, pageWidth, pageHeight);
        doc.addPage();
        verticalPosition = margin + fontSize;
        currentPage++;
      }

      // Render text and images
      if (item.type === 'text') {
        item.lines.forEach((line: string) => {
          doc.text(line, margin, verticalPosition);
          verticalPosition += fontSize;
        });
      } else if (item.type === 'image') {
        doc.addImage(item.imageData, 'JPEG', margin, verticalPosition, 180, 160);
        verticalPosition += 170;
      }
    });

    this.addPageNumber(doc, currentPage, pageWidth, pageHeight);
    this.pdfDoc = doc;

    return doc;
  }

  // Convert HTML content into structured content (text, heading, lists, and images)
  convertHtmlToPdfContent(htmlContent: string): Array<any> {
    const content: Array<any> = [];
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    const children = Array.from(container.childNodes);

    children.forEach((child) => {
      if (child.nodeName === 'P') {
        content.push({ type: 'text', lines: this.splitTextIntoLines(child.textContent ?? '') });
      } else if (child.nodeName === 'H1' || child.nodeName === 'H2' || child.nodeName === 'H3') {
        content.push({
          type: 'text',
          lines: this.splitTextIntoLines(child.textContent ?? ''),
          style: 'heading',
        });
      } else if (child.nodeName === 'UL') {
        const listItems = Array.from(child.childNodes).map((li: any) => li.textContent || '');
        listItems.forEach((listItem) => {
          content.push({ type: 'text', lines: this.splitTextIntoLines('- ' + listItem) });
        });
      } else if (child.nodeName === 'IMG') {
        const imageData = (child as HTMLImageElement).src;
        content.push({ type: 'image', imageData });
      }
    });

    return content;
  }

  // Split text into multiple lines if it exceeds the maximum width of the page
  splitTextIntoLines(text: string): string[] {
    const lines: string[] = [];
    const maxWidth = 180;
    const doc = new jsPDF();
    lines.push(...doc.splitTextToSize(text, maxWidth));
    return lines;
  }

  // Add page number at the bottom of each page
  addPageNumber(doc: jsPDF, pageNumber: number, pageWidth: number, pageHeight: number): void {
    const pageNumberText = `Page ${pageNumber}`;
    doc.setFontSize(10);
    const textWidth = doc.getTextDimensions(pageNumberText).w;
    const textX = (pageWidth - textWidth) / 2;
    const textY = pageHeight - 10;
    doc.text(pageNumberText, textX, textY);
  }

  // Download the generated PDF
  onDownloadClick(): void {
    if (this.pdfDoc) {
      this.pdfDoc.save('docx-images.pdf');
    } else {
      alert('Please upload a DOCX file first');
    }
  }

  // Create pagination for the preview content
  createPagination(htmlContent: string): void {
    setTimeout(() => {
      const containerHeight = this.previewContainer.nativeElement.clientHeight;
      const contentHeight = this.previewContainer.nativeElement.scrollHeight;
      this.totalPages = Math.ceil(contentHeight / containerHeight);
      this.currentPage = 1;
      this.scrollToPage();
    }, 100);
  }

  // Navigate to the previous page
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToPage();
    }
  }

  // Navigate to the next page
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToPage();
    }
  }

  // Scroll to the specific page
  scrollToPage(): void {
    const containerHeight = this.previewContainer.nativeElement.clientHeight;
    const scrollPosition = (this.currentPage - 1) * containerHeight;
    this.previewContainer.nativeElement.scrollTop = scrollPosition;
  }
}
