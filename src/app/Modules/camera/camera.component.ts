import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Tesseract from 'tesseract.js';
import { CouchService } from '../../Services/couch.service';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import { ChatbotService } from '../../Services/chatbot.service';
import * as cv from '@techstark/opencv-js';
import { ChatBotComponent } from '../chat-bot/chat-bot.component';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatBotComponent],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.css'
})
export class CameraComponent {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  capturedPhoto: string | null = null;
  croppedImage: string = '';
  stream: MediaStream | null = null;
  context!: CanvasRenderingContext2D;
  extractedText: string = '';
  textExtracted: string = '';
  startX: number = 0;
  startY: number = 0;
  width: number = 0;
  height: number = 0;
  isDrawing: boolean = false;
  documentid: string = '';
  userid: string = localStorage.getItem('userId') ?? '';
  date: Date = new Date();
  onlyDate: string = this.date.toISOString().split('T')[0];
  document_name: string = 'capturedImage';
  finalCapturedPhoto: string = '';
  summarizedText: string = '';
  extractedTextfinal: string = '';
  summarylevel: string = 'Give me a general paragraph on';

  constructor(readonly couch: CouchService,readonly http: HttpClient,readonly chat: ChatbotService) {}

  ngOnInit(): void {
    this.initializeCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  // Initialize Camera
  async initializeCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  // Stop Camera
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }

  // Select Full Image
  selectFullImage(): void {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const fullCanvas = document.createElement('canvas');
      const fullCtx = fullCanvas.getContext('2d');
      fullCanvas.width = canvas.width;
      fullCanvas.height = canvas.height;
      if (fullCtx) {
        fullCtx.drawImage(canvas, 0, 0);
        this.croppedImage = fullCanvas.toDataURL();
      }
    }
  }

  // Capture Photo
  capturePhoto(): void {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedPhoto = canvas.toDataURL('image/png');
      this.context = context;
      this.finalCapturedPhoto = this.capturedPhoto.split(',')[1];
      this.stopCamera();
      this.stream = null;
    }
  }

  // Retake Button
  retakeButton(): void {
    this.capturedPhoto = null;
    this.initializeCamera();
  }

  // Mouse Down for Cropping
  onMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    this.startX = event.offsetX;
    this.startY = event.offsetY;
  }

  // Mouse Move for Cropping
  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing) return;
    const canvas = this.canvasElement.nativeElement;
    const context = this.context;

    this.width = event.offsetX - this.startX;
    this.height = event.offsetY - this.startY;

    const image = new Image();
    image.src = this.capturedPhoto!;
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.strokeStyle = 'green';
      context.lineWidth = 2;
      context.strokeRect(this.startX, this.startY, this.width, this.height);
    };
  }

  // Mouse Up for Cropping
  onMouseUp(event: MouseEvent): void {
    this.isDrawing = false;
  }

  // Crop Image
  cropImage(): void {
    const canvas = this.canvasElement.nativeElement;
    const croppedCanvas = document.createElement('canvas');
    const croppedContext = croppedCanvas.getContext('2d')!;

    if (this.width === 0 || this.height === 0) {
      console.error('Invalid crop area');
      return;
    }

    croppedCanvas.width = Math.abs(this.width);
    croppedCanvas.height = Math.abs(this.height);

    croppedContext.drawImage(
      canvas,
      this.startX,
      this.startY,
      this.width,
      this.height,
      0,
      0,
      Math.abs(this.width),
      Math.abs(this.height)
    );

    this.croppedImage = croppedCanvas.toDataURL('image/png');
  }

  // Preprocess Image for Better OCR Accuracy
  async preprocessImage(imageData: string, factor: number): Promise<string> {
    const img = new Image();
    img.src = imageData;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const src = cv.imread(canvas);
    const dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);

    const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(dst, dst);

    cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, kernel);

    cv.imshow(canvas, dst);
    const preprocessedImage = canvas.toDataURL('image/png');

    src.delete();
    dst.delete();
    clahe.delete();
    kernel.delete();

    return preprocessedImage;
  }

  // Extract Text Using Tesseract.js
  extractTextFromImage(imageData: string): void {
    if (!imageData) {
      console.error('No image data to process for OCR');
      return;
    }

    Tesseract.recognize(imageData, 'eng+tam+hin')
      .then(({ data: { text } }) => {
        this.extractedText = text;
        this.chat.extractedText = this.extractedText;
        this.chat.summarylevel = this.summarylevel;
      })
      .catch((error) => console.error('OCR Error:', error));
  }

  // Add Document to CouchDB
  addToCouch(): void {
    this.generateUUID();
    const documentData = {
      _id: this.documentid,
      data: {
        userid: this.userid,
        uploaded_document_name: this.document_name,
        summarized_document_name: `summary-${this.document_name}`,
        date: this.onlyDate,
        summarized_document_content: this.summarizedText,
        type: 'documents',
      },
      _attachments: {
        [this.document_name]: {
          content_type: 'image/png',
          data: this.finalCapturedPhoto,
        },
      },
    };

    if (this.document_name) {
      this.couch.addDocument(documentData).subscribe({
        next: (response) => {
          alert('Document data added successfully');
          console.log(response);
        },
        error: (error) => {
          alert('oops! Document data not added');
        },
      });
    }
  }

  // Generate UUID for Document ID
  generateUUID(): void {
    this.documentid = `document_2_${uuidv4()}`;
  }

  botResponse: string = '';
}
