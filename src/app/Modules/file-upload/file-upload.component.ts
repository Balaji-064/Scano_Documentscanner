import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import mammoth from 'mammoth';

import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';
import { CouchService } from '../../Services/couch.service';
import { ChatbotService } from '../../Services/chatbot.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [FormsModule, CommonModule, PdfViewerModule, RouterModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css'
})
export class FileUploadComponent {


  @ViewChild('cropCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  selectedText: string = '';
  summarizedContent: string = '';
  selectedContents: string[] = [];
  selectedItems: boolean[] = [];
  currentPage: number = 1;
  textChunks: string[] = [];
  selectedFormat: string = 'txt';
  selectedSummaryLevel: string = '';
  uploadvalue: boolean = false
  selectedTextval: boolean = false

  documentid: string = ''
  user_id: string = localStorage.getItem("userId")!;
  document_name: string = ''
  document_type: string = ''
  pdfSrc: string | undefined;


  // Process image
  cropCanvas: HTMLCanvasElement;
  imageSrc: string = '';
  @ViewChild('cropCanvas', { static: false }) Canvas!: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D | null = null;


  fileContent: string = '';
  pageSize: number = 20; // 20 lines per page
  imageUrl: string = '';
  base64String: string = ''
  date: Date = new Date()
  onlyDate = this.date.toISOString().split("T")[0];
  base64WithMime: any;
  data: any;
  totalPages: any;
  userMessage: string = '';
  finalSelectedContent: string[] = [];
  pdfsample: string | ArrayBuffer | null = null;
  pdfsrc: string = '';
  pdfscrvariable: string = '';





  constructor(readonly http: HttpClient, readonly documentViewerService: CouchService, readonly chatbotService: ChatbotService) {
    this.cropCanvas = document.createElement('canvas');
  }

  generateuuid() {
    this.documentid = `document_2_${uuidv4()}`;
  }

  onFileChange(event: any) {
    this.uploadvalue = true
    const file = event.target.files[0];
    this.document_name = file.name;
    this.document_type = file.type
    this.croppedImageSrc = ''
    this.imageSrc = ''
    this.pdfSrc = ''
    this.fileContent = ''
    this.textChunks = []

    if (file) {
      if (file.type.startsWith('image')) {
        this.handleImageUpload(file);
      }
      else if (file && file.type === 'application/pdf') {
        this.readpdf(file)
      }
      else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        this.readDocxFile(file);
      } else if (file.type === 'text/plain') {
        this.readTextFile(file);
      } else {
        alert('Invalid file format!');
      }
    }
  }
  // Read and parse text files
  readTextFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fileContent = e.target.result;

      console.log("File Content Before Encoding:", this.fileContent);

      // Convert to Base64 properly without using unescape()
      const textEncoder = new TextEncoder();
      const encodedText = btoa(String.fromCharCode(...new Uint8Array(textEncoder.encode(this.fileContent))));

      // Add MIME type
      const base64WithMime = `data:${file.type};base64,${encodedText}`;

      console.log('Base64 Output with MIME Type:', base64WithMime);

      if (base64WithMime) {


        this.data = encodedText;
        console.log("Assigned to data:", this.data);
      } else {
        console.error("Base64 conversion failed.");
      }

      // Ensure paginateText() exists before calling
      if (typeof this.paginateText === 'function') {
        setTimeout(() => {
          this.paginateText();
        }, 0);
      } else {
        console.error("paginateText() is not defined or accessible.");
      }
    };
    reader.readAsText(file);
  }


  // readpdf(file:File){
  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     const blob = new Blob([reader.result as ArrayBuffer], { type: 'application/pdf' });
  //     this.pdfSrc = URL.createObjectURL(blob);
  //     this.currentPage=1
  //   };
  //   reader.readAsArrayBuffer(file);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
  // } 

  readpdf(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      let base64String = reader.result as string;
      this.pdfscrvariable = base64String

      // Remove MIME type and extract only Base64 data
      const base64Data = base64String.split(',')[1];

      this.pdfSrc = base64Data;

      console.log(`Extracted Base64 PDF Data: ${this.pdfSrc}`);

      this.currentPage = 1;
    };

    reader.readAsDataURL(file);
  }


  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary); // Convert binary string to Base64
  }



  afterLoadComplete(pdf: any) {
    this.totalPages = pdf.numPages; // Get the total number of pages
  }




  // Read and parse DOCX files
  readDocxFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result; // Get binary data
      const base64String = this.arrayBufferToBase64(arrayBuffer);

      // Create a proper data URL with the correct MIME type for DOCX
      const base64WithMime = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64String}`;

      console.log('Base64 DOCX Output:', base64WithMime);

      // Assign Base64 content
      this.data = base64String;

      // Extract text using Mammoth (optional, if you still need the extracted text)
      mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
        .then((result) => {
          let docContent = result.value;

          // Preserve line breaks
          docContent = docContent.replace(/<\/p>/g, '<br/>');
          docContent = docContent.replace(/<p[^>]*>/g, '');

          this.fileContent = docContent;
          this.currentPage = 1;
          this.paginateText(); // Paginate DOCX content
        })
        .catch((err) => console.error('Error converting DOCX:', err));
    };
    reader.readAsArrayBuffer(file); // Read file as binary
  }




  // Paginate the text content (both text and DOCX files)
  paginateText() {
    let allLines: string[] = [];

    // If the file is text, split it by new line characters (\n or \r\n)
    if (this.fileContent.includes('<br/>')) {
      // DOCX content (with <br/> line breaks)
      allLines = this.fileContent.split('<br/>');
    } else {
      // Text file content (split by actual line breaks)
      allLines = this.fileContent.split(/\r\n|\n/);
    }

    let chunk = '';
    this.textChunks = []; // Clear previous chunks
    this.currentPage = 1

    allLines.forEach((line, index) => {
      chunk += line + '<br/>';

      // If chunk reaches max page size (20 lines), push it and start a new chunk
      if ((index + 1) % this.pageSize === 0 || index === allLines.length - 1) {
        this.textChunks.push(chunk);
        chunk = ''; // Reset chunk
      }
    });
  }

  // Go to the next page
  nextPage() {
    if (this.currentPage < this.totalPages || this.textChunks.length) {
      this.currentPage++;
    }
  }

  // Go to the previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Handle text selection
  onTextSelect() {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      this.selectedText = selection.toString();
      this.selectedTextval = true
    }
  }

  // Add the selected content to the list of added contents
  addSelectedContent() {
    if (this.selectedText && !this.selectedContents.includes(this.selectedText)) {
      this.selectedContents.push(this.selectedText);
      console.log(this.selectedText);
      this.selectedText = '';
      this.selectedTextval = false
      // Reset selected text after adding it


    }
  }

  toggleSelection(item: string, index: number) {
    if (this.selectedItems[index]) {
      this.finalSelectedContent.push(item);
    } else {
      this.finalSelectedContent = this.finalSelectedContent.filter(content => content !== item);
    }
  }


  // Reset the selection (if needed for UX improvements)
  resetSelection() {
    this.selectedTextval = false;
  }

  removeSelectedContent(index: number) {
    this.selectedContents.splice(index, 1);
  }




  download() {
    const selectedText = this.selectedContents.filter((_, index) => this.selectedItems[index]);

    if (selectedText.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    let content = selectedText.join('\n'); // Combine selected items

    if (this.selectedFormat === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      saveAs(blob, 'selected-content.txt');
    } else if (this.selectedFormat === 'doc') {
      const blob = new Blob([content], { type: 'application/msword' });
      saveAs(blob, 'selected-content.doc');
    } else if (this.selectedFormat === 'pdf') {
      this.generatePDF(content);
    }
  }

  downloadsummarized() {
    const selectedText = this.selectedContents.filter((_, index) => this.selectedItems[index]);

    if (selectedText.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    let content = selectedText.join('\n'); // Combine selected items

    if (this.selectedFormat === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      saveAs(blob, 'selected-content.txt');
    } else if (this.selectedFormat === 'doc') {
      const blob = new Blob([content], { type: 'application/msword' });
      saveAs(blob, 'selected-content.doc');
    } else if (this.selectedFormat === 'pdf') {
      this.generatePDF(content);
    }
  }


  generatePDF(content: string) {
    import('jspdf').then(jsPDF => {
      const doc = new jsPDF.default();

      doc.text(content, 10, 10);
      doc.save('selected-content.pdf');
    });
  }



  messages: string[] = [];
  summaryselectedcontents: string[] = []

  sendMessage(): void {
    if (this.finalSelectedContent) {
      // Add user message to the chat
      this.summaryselectedcontents = this.finalSelectedContent
      let concatenatedMessage = this.summaryselectedcontents.join(' ');
      console.log(concatenatedMessage);

      this.messages.push('You: ' + concatenatedMessage);

      // Get response from the chatbot API
      this.chatbotService.getResponse(concatenatedMessage, `Give me ${this.selectedSummaryLevel} lines of general paragraph on`).subscribe(response => {
        this.summarizedContent = response.candidates[0].content.parts[0].text;
        concatenatedMessage = ''
      });


      // Clear the input field
      this.userMessage = '';

    }
  }




  isAnyContentSelected(): boolean {
    return this.selectedItems.some(item => item); // Returns true if any checkbox is checked
  }


  cropping: boolean = false;
  startX: number = 0;
  startY: number = 0;
  cropX: number = 0;
  cropY: number = 0;
  width: number = 0;
  height: number = 0;


  croppedImageSrc: string = ''; // For the cropped image

  img: HTMLImageElement = new Image();



  ngAfterViewInit() {
    this.initializeCanvas();
  }

  initializeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }






  handleImageUpload(file: File) {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const base64String = e.target.result;
      this.imageSrc = this.imageSrc.split(',')[1]; // Remove metadata
      // Base64 string from FileReader
      this.imageSrc = base64String; // Set it for preview in <img> tag

      // Create a new Image object to process it in a canvas
      const img = new Image();
      img.onload = () => {
        // Draw the image on canvas
        const canvas = this.canvasRef.nativeElement;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        console.log(this.imageSrc);


        // Convert canvas to Base64 and remove metadata
        this.data = canvas.toDataURL().split(',')[1]; // Pure Base64 without "data:image/png;base64,"


        this.loadImageOnCanvas();
      };

      img.src = base64String; // Triggers img.onload
    };

    reader.readAsDataURL(file); // Convert file to Base64
  }

  loadImageOnCanvas() {
    if (!this.imageSrc || !this.cropCanvas) return;

    this.img = new Image();
    this.img.src = this.imageSrc;

    this.img.onload = () => {
      const canvas = this.Canvas.nativeElement; // ✅ Correct usage
      this.ctx = canvas.getContext('2d');

      if (!this.ctx) return;

      // Resize canvas to match image
      canvas.width = this.img.width;
      canvas.height = this.img.height;

      // Draw the image onto the canvas
      this.ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
    };
  }

  startCropping(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const canvasRect = canvas.getBoundingClientRect();

    // Normalize startX and startY based on actual canvas size
    this.startX = (event.clientX - canvasRect.left) * (canvas.width / canvasRect.width);
    this.startY = (event.clientY - canvasRect.top) * (canvas.height / canvasRect.height);

    this.cropping = true;
  }

  drawCropArea(event: MouseEvent) {
    if (!this.cropping) return;

    const canvas = this.canvasRef.nativeElement;
    const canvasRect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Normalize current mouse position
      let currentX = (event.clientX - canvasRect.left) * (canvas.width / canvasRect.width);
      let currentY = (event.clientY - canvasRect.top) * (canvas.height / canvasRect.height);

      // Ensure proper cropping direction (always from top-left)
      this.width = Math.abs(currentX - this.startX);
      this.height = Math.abs(currentY - this.startY);
      this.cropX = Math.min(this.startX, currentX);
      this.cropY = Math.min(this.startY, currentY);

      // Clear and redraw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);

      // Draw cropping rectangle
      ctx.beginPath();
      ctx.rect(this.cropX, this.cropY, this.width, this.height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  finishCropping() {
    if (!this.cropping || this.width <= 0 || this.height <= 0) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');

      croppedCanvas.width = this.width;
      croppedCanvas.height = this.height;

      if (croppedCtx) {
        // Always crop from the correct area
        croppedCtx.drawImage(
          canvas,
          this.cropX, this.cropY, this.width, this.height, // Source (cropped area)
          0, 0, this.width, this.height                   // Destination
        );

        this.croppedImageSrc = croppedCanvas.toDataURL();
        // Update preview with cropped image
      }
    }

    this.cropping = false;
  }

  selectFullImage() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const fullCanvas = document.createElement('canvas');
      const fullCtx = fullCanvas.getContext('2d');

      fullCanvas.width = canvas.width;
      fullCanvas.height = canvas.height;

      if (fullCtx) {
        // Copy the entire image
        fullCtx.drawImage(canvas, 0, 0);

        // Convert to Data URL and set as cropped image
        this.croppedImageSrc = fullCanvas.toDataURL();
        this.imageUrl = this.croppedImageSrc; // Update preview with full image
      }
    }

    this.cropping = false;
  }




  extractTextFromImage(imageurl: string) {
    Tesseract.recognize(imageurl, 'eng+tam+hin')
      .then(({ data: { text } }) => {
        this.selectedText = text

        this.selectedTextval = true
      })
      .catch((error) => console.error('OCR Error:', error));
  }


  resetCrop() {
    this.cropping = false;
    this.croppedImageSrc = '';
    this.imageSrc = '';
    this.initializeCanvas();
  }



  addToCouch() {
    this.generateuuid();
    console.log(this.documentid);

    const document_data = {
      _id: this.documentid,
      data: {
        userid: this.user_id,
        uploaded_document_name: this.document_name,
        summarized_document_name: `summary-${this.document_name}`,
        date: this.onlyDate,
        summarized_document_content: this.summarizedContent,
        type: "documents"
      }, // Summarized document content
      _attachments: {
        [this.document_name]: {
          content_type: this.document_type,  // MIME type of the attachment
          data: this.data || this.imageSrc || this.pdfSrc
          // Base64 encoded attachment content
        }
      }
    }
    console.log(document_data);
    console.log(this.pdfSrc);



    if (this.document_name) {
      console.log("inside the add");

      this.documentViewerService.addDocument(document_data).subscribe({
        next: (response) => {
          alert("document_data added successfully");

          console.log(response);
        },
        error: (error) => {
          alert("oops! document_data is not added!");
        }
      })
    }
  }


}





