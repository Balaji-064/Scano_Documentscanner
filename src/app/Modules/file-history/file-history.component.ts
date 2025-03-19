import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as Mammoth from 'mammoth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';
import { CouchService } from '../../Services/couch.service';
import * as d3 from 'd3';
import { style } from '@angular/animations';
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
  selector: 'app-file-history',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule, PdfViewerModule, SidebarComponent],
  templateUrl: './file-history.component.html',
  styleUrl: './file-history.component.css'
})
export class FileHistoryComponent implements OnInit  {

  user_id: string = localStorage.getItem("userId")!;
  getdata: any[] = [];
  selectedContent: any = null;
  contentType: string = '';
  today: Date = new Date();
  showselectformatvariable: boolean=false;
  selectedFormat: any;
  summarizedcontent: any;
  content: string='';
  fileType: string='';
  fileName: string='';
  downloadfile: boolean=false;

  constructor(readonly data: CouchService, readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.getDocuments();
  }

  getDocuments(): void {
    console.log(this.user_id);
    
    this.data.getDocument(this.user_id).subscribe({
      next: (response: any) => {
        console.log(response);
        
        if (response && response.rows && response.rows.length > 0) {
          this.getdata = response.rows.map((row: any, index: number) => {
            const attachments = row.doc._attachments || {};
            const attachmentKeys = Object.keys(attachments);

            let fileContent: any = null;
            let fileType: string | null = null;
            let decodedContent: any = null;
            let contentType: string = '';

            if (attachmentKeys.length > 0) {
              const firstAttachmentKey = attachmentKeys[0];
              const firstAttachment = attachments[firstAttachmentKey];

              fileType = firstAttachment.content_type;
              fileContent = firstAttachment.data;

              if (fileType?.includes('image')) {
                decodedContent = this.sanitizer.bypassSecurityTrustUrl(`data:${fileType};base64,${fileContent}`);
                contentType = 'image';
              } else if (fileType?.includes('pdf')) {
                decodedContent = this.sanitizer.bypassSecurityTrustResourceUrl(`data:${fileType};base64,${fileContent}`);
                contentType = 'pdf';
              } else if (fileType?.includes('text') || fileType?.includes('plain')) {
                decodedContent = this.decodeBase64Unicode(fileContent);
                contentType = 'text';
              } else if (fileType?.includes('word') || fileType?.includes('msword') || fileType?.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                decodedContent = fileContent;
                contentType = 'doc';
              } else {
                decodedContent = 'Unsupported format';
                contentType = 'unknown';
              }
            }

            return {
              index: index + 1,
              document_name: row.doc.data.uploaded_document_name || attachmentKeys[0] || 'Unknown',
              summarized_document_name: row.doc.data.summarized_document_name || 'No summary available',
              summarized_document_content: row.doc.data.summarized_document_content,
              date: row.doc.data.date || 'N/A',
              file: fileContent,
              fileType: fileType,
              decodedContent: decodedContent,
              contentType: contentType
            };
            
          });
        } else {
          this.getdata = [];
        }
        const formatCounts = this.processData(this.getdata);
        this.createPieChart(formatCounts);
      },
      error: (error) => {
        console.error('Error fetching documents:', error);
        alert('An error occurred while fetching documents,Make sure you login in !');
      }
    });
  }

  sortOrder: 'asc' | 'desc' = 'asc';

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortDocuments()
  }



sortDocuments() {
  this.getdata.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
}


 
  processData(data: any[]) {
    const formatCounts: { [key: string]: number } = {};
  
    data.forEach(doc => {
      const format = doc.contentType; // Get content type (pdf, text, image, doc)
      if (format) {
        formatCounts[format] = (formatCounts[format] || 0) + 1;
      }
    });
  
    return Object.entries(formatCounts).map(([format, count]) => ({
      format,
      count
    }));
  }



  createPieChart(data: { format: string; count: number }[]) {
    const heading="activities"
    d3.select("#chart").selectAll("*").remove(); // Clear previous chart
  
    const container = document.getElementById("chart");
    if (!container) return;
  
    const containerWidth = container.clientWidth; // Get container width
    const containerHeight = container.clientHeight || 300; // Default to 300 if not set
  
    const legendWidth = 130; // Extra space for the legend
    const width = containerWidth - legendWidth; // Adjust width dynamically
    const height = containerHeight;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius -30;// Increase the total width
  
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", containerWidth-50) // Wider canvas for legend space
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
  
    // Define color mapping
    const colorMap: { [key: string]: string } = {
      pdf: "#9BBFE0",
      text: "#E8A45A",
      image: "#3380ff",
      doc: "#FBE45F",
      unknown: "# C6D68F"
    };
  
    const pie = d3.pie<{ format: string; count: number }>().value(d => d.count);
  
    const arc = d3.arc<d3.PieArcDatum<{ format: string; count: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);
  
    const arcs = svg.selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g");
  
    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "black")
      .style("color","white")
      .style("padding", "8px")
      .style("border-radius", "5px")
      .style("display", "none")
      .style("transition","0.1s")
      .style("pointer-events", "none");
      
  
    // Draw pie slices
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => colorMap[d.data.format] || "#000000")
      .style("stroke-width", "2px")
      .on("mouseover", function (event, d) {
        tooltip.style("display", "block")
          .html(`<strong>${d.data.format}</strong>: ${d.data.count} files`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
      });
  
    // Create legend (placed outside the chart)
    const legend = d3.select("#chart").select("svg")
      .append("g")
      .attr("transform", `translate(${width + 20}, ${height / 4})`); // Shift legend to right
  
    const legendItems = legend.selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(0, ${i * 25})`); // Adjust spacing
  
    legendItems.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => colorMap[d.format] || "#000000");
  
    legendItems.append("text")
      .attr("x", 25)
      .attr("y", 12)
      .attr("font-size", "12px")
      .text(d => `${d.format} `);
  }
  

  

  displayContentsample(content: any, fileType?: string): void {
  if (!content) {
    this.selectedContent = null;
    this.contentType = 'text';
    return;
  }
  this.showselectformatvariable=false

  if (fileType?.includes('image')) {
    const imageUrl = `data:${fileType};base64,${content}`;
    console.log("Image URL:", imageUrl);  // ✅ Debugging
    this.selectedContent = imageUrl;
    this.contentType = 'image';
  }
  // ✅ Check if this logs correctly
   else if (fileType?.includes('pdf')) {
    const pdfSrc = `data:${fileType};base64,${content}`;
    this.selectedContent = pdfSrc
    this.contentType = 'pdf';
  } else if (fileType?.includes('text') || fileType?.includes('plain')) {
    this.selectedContent = this.decodeBase64Unicode(content);
    this.contentType = 'text';
  } else if (fileType?.includes('word')) {
    const byteArray = new Uint8Array(atob(content).split('').map(c => c.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: fileType });
    const reader = new FileReader();

    reader.onload = (event: any) => {
      Mammoth.convertToHtml({ arrayBuffer: event.target.result }).then((result) => {
        this.selectedContent = this.sanitizer.bypassSecurityTrustHtml(result.value);
        this.contentType = 'doc';
      });
    };
    reader.readAsArrayBuffer(blob);
  } else {
    this.selectedContent = 'Unsupported format';
    this.contentType = 'unknown';
  }
}

selectedSummary: string | null = null;

displayContentSummary(content: string): void {
  this.selectedContent = content;
  this.contentType='text'
  console.log(this.selectedContent); 
  this.showselectformatvariable=false
}




  decodeBase64Unicode(str: string): string {
    try {
      return decodeURIComponent(atob(str).split('').map((c) =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
    } catch (e) {
      console.error('Base64 decoding error:', e);
      return 'Error decoding text';
    }
  }
  
  

  closeSummary(): void {
    this.selectedContent = null;
    this.showselectformatvariable=false
    this.downloadfile=false
  }

  showselectformat(summarizedcontent:any){
    this.showselectformatvariable=true
    this.summarizedcontent=summarizedcontent
    this.selectedFormat=''
  }



  downloadSummary(content: string, fileType: string): void {
    if (!content) {
      alert('No content available.');
      return;
    }
    if(fileType==''){
      alert("Please select any file type before downloading!")
    }
    else{
  
    const fileName = `summary.${this.getFileExtensions(fileType)}`;
    this.createBlob(content, fileType).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    this.closeSummary()
  }
  }
  
  // ✅ Get correct file extension
  getFileExtensions(fileType: string): string {
    return fileType === 'txt' ? 'txt' : fileType === 'pdf' ? 'pdf' : 'docx';
  }
  
  // ✅ Create Blob based on file type
  createBlob(content: string, fileType: string): Promise<Blob> {
    if (fileType === 'txt') {
      return Promise.resolve(new Blob([content], { type: 'text/plain' }));
    } else if (fileType === 'pdf') {
      return this.createPDFBlob(content);
    } else if (fileType === 'docx') {
      return this.createDOCXBlob(content);
    } else {
      return Promise.reject(new Error('Unsupported file type'));
    }
  }
  
  // ✅ Properly generates a PDF with correct MIME type
  createPDFBlob(content: string): Promise<Blob> {
    return new Promise((resolve) => {
      const pdf = new jsPDF();
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
      const textLines = pdf.splitTextToSize(content, pageWidth);
      
      pdf.text(textLines, margin, margin);
      
      const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
      resolve(pdfBlob);
    });
  }
  
  // ✅ DOCX file generation
  createDOCXBlob(content: string): Promise<Blob> {
    return new Promise((resolve) => {
      const doc = new Document({
        sections: [{ children: [new Paragraph(content)] }],
      });
  
      Packer.toBlob(doc).then((blob) => resolve(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })));
    });
  }
  
  downloadFileauth(content: string, fileType: string, fileName: string){
    this.content=content;
    this.fileType=fileType;
    this.fileName=fileName;
    this.downloadfile=true;
  }

  downloadFile(content: string, fileType: string, fileName: string): void {
    if (!content || !fileType) {
      console.error("Invalid file content or type!");
      return;
    }
  
    // ✅ Extract Base64 part (removes MIME prefix)
    const base64Data = this.extractBase64Data(content);
  
    // ✅ Convert Base64 to Uint8Array
    const byteArray = this.base64ToUint8Array(base64Data);
  
    // ✅ Create a Blob with the correct MIME type
    const blob = new Blob([byteArray], { type: fileType });
  
    // ✅ Generate a URL for download
    const url = URL.createObjectURL(blob);
  
    // ✅ Create a link element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `download.${this.getFileExtension(fileType)}`;
    document.body.appendChild(a);
    a.click();
  
    // ✅ Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.closeSummary()
    this.downloadfile=false
  }

  
  // ✅ Extracts Base64 part (removes MIME prefix like "data:image/png;base64,")
extractBase64Data(base64String: string): string {
  return base64String.includes(',') ? base64String.split(',')[1] : base64String;
}

// ✅ Converts Base64 to Uint8Array for binary file downloads
base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ✅ Determines the correct file extension based on MIME type
getFileExtension(mimeType: string): string {
  const mimeMap: { [key: string]: string } = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  };
  return mimeMap[mimeType] || 'bin'; // Default to '.bin' for unknown types
}

}



