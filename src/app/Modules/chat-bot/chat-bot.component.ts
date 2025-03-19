import { Component, Input} from '@angular/core';
import { ChatbotService } from '../../Services/chatbot.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CouchService } from '../../Services/couch.service';
import { v4 as uuidv4 } from 'uuid'

@Component({
  selector: 'app-chat-bot',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './chat-bot.component.html',
  styleUrl: './chat-bot.component.css'
})
export class ChatBotComponent  {
  extractedTextfinal: any;
  // extractedText: string = '';
  summarizedText: any;
  documentid: any;
  userid: any;
  document_name: any;
  onlyDate: any;
  finalCapturedPhoto: any;
  capturedPhoto: any;

  constructor(readonly chat: ChatbotService, readonly couch: CouchService) { }
  @Input() extractedText = this.chat.extractedText;
  @Input()summarylevel=this.chat.summarylevel
  sendMessage(summarylevel:string): void {
    
    if (this.extractedText.trim()) {
      this.extractedTextfinal = this.extractedText
       // Add user message to the chat
      // Get response from the chatbot API
      this.chat.getResponse(this.extractedTextfinal,summarylevel).subscribe(response => {
        this.summarizedText = response.candidates[0].content.parts[0].text
        this.summarylevel=''
      });
      console.log(this.extractedText);
      console.log(this.summarizedText)
      // Clear the input field
      this.extractedText = '';
    }
  }
  generateuuid() {
    this.documentid = `document_2_${uuidv4()}`;
  }

}
