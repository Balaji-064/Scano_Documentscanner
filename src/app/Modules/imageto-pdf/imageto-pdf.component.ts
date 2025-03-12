import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { jsPDF } from 'jspdf';
@Component({
  selector: 'app-imageto-pdf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imageto-pdf.component.html',
  styleUrl: './imageto-pdf.component.css'
})
export class ImagetoPdfComponent {
  imageUrls: string[] = []; // Array to store URLs of uploaded images
  capturedImages: string[] = []; // Array to store URLs of captured images
  stream: MediaStream | null = null; // Camera stream
  isCameraStarted: boolean = false; // To track if the camera is started

  // Handle file selection for uploading images
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.imageUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(input.files[i]);
      }
    }
  }

  // Start the camera
  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.isCameraStarted = true;
    } catch (error) {
      console.error('Error accessing the camera', error);
    }
  }

  // Capture an image from the camera
  captureImage(): void {
    if (!this.stream) return;

    const videoElement = document.querySelector('#cameraFeed') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL and add to captured images
    const capturedImageUrl = canvas.toDataURL('image/jpeg');
    this.capturedImages.push(capturedImageUrl);

    // Stop the camera after capturing
    this.stopCamera();
  }

  // Stop the camera
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.isCameraStarted = false;
    }
  }

  // Delete an image (uploaded or captured)
  deleteImage(index: number, isCaptured: boolean): void {
    if (isCaptured) {
      this.capturedImages.splice(index, 1);
    } else {
      this.imageUrls.splice(index, 1);
    }
  }

  // Check if PDF generation is enabled
  isGeneratePdfEnabled(): boolean {
    return this.imageUrls.length > 0 || this.capturedImages.length > 0;
  }

  // Generate PDF from uploaded and captured images
  generatePDF(): void {
    const pdf = new jsPDF();
    const pageWidth = 210; // A4 page width in mm
    const pageHeight = 297; // A4 page height in mm

    // Combine uploaded and captured images
    const allImages = [...this.imageUrls, ...this.capturedImages];

    allImages.forEach((imageUrl, index) => {
      if (index > 0) {
        pdf.addPage(); // Add a new page for each image after the first
      }

      const img = new Image();
      img.src = imageUrl;

      // Calculate scale to fit image within A4 dimensions
      const scaleX = pageWidth / img.width;
      const scaleY = pageHeight / img.height;
      const scale = Math.min(scaleX, scaleY);

      // Calculate new width and height
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;

      // Center the image on the A4 page
      const xOffset = (pageWidth - newWidth) / 2;
      const yOffset = (pageHeight - newHeight) / 2;

      // Add the image to the PDF
      pdf.addImage(img, 'JPEG', xOffset, yOffset, newWidth, newHeight);
    });

    // Save the PDF
    pdf.save('images.pdf');
  }
}
