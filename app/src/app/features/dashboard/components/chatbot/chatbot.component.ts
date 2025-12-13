import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

interface Message {
  text: string;
  isUser: boolean;
  time: string;
}

@Component({
  selector: "app-chatbot",
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule],
  template: `
    <div class="flex flex-col h-full bg-white border-l border-gray-200 shadow-sm">
      <div class="p-4 border-b border-gray-200 bg-blue-50">
        <div class="flex items-center gap-2">
          <mat-icon class="text-blue-600">smart_toy</mat-icon>
          <h3 class="font-semibold text-gray-800 m-0">AI Assistant</h3>
        </div>
        <p class="text-xs text-gray-500 mt-1">Always here to help you analyze risks.</p>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <div *ngFor="let msg of messages" class="flex flex-col" [ngClass]="{'items-end': msg.isUser, 'items-start': !msg.isUser}">
          <div 
            class="max-w-[85%] p-3 rounded-lg text-sm shadow-sm"
            [ngClass]="{
              'bg-blue-600 text-white rounded-br-none': msg.isUser,
              'bg-white text-gray-800 border border-gray-200 rounded-bl-none': !msg.isUser
            }"
          >
            {{ msg.text }}
          </div>
          <span class="text-[10px] text-gray-400 mt-1 px-1">{{ msg.time }}</span>
        </div>
      </div>

      <div class="p-4 bg-white border-t border-gray-200">
        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input 
            type="text" 
            [(ngModel)]="newMessage" 
            (keyup.enter)="sendMessage()"
            placeholder="Ask about patient risk..." 
            class="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
          />
          <button 
            (click)="sendMessage()" 
            [disabled]="!newMessage.trim()"
            class="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <mat-icon class="text-sm w-4 h-4 flex items-center justify-center">send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    /* Override Material Icon size for the small send button */
    button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ChatbotComponent {
  messages: Message[] = [
    { text: "Hello! I'm your AI medical assistant. How can I help you with the risk analysis today?", isUser: false, time: "10:00 AM" }
  ];
  newMessage = "";

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.messages.push({
      text: this.newMessage,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    const userMsg = this.newMessage;
    this.newMessage = "";

    // Simulate AI response
    setTimeout(() => {
      this.messages.push({
        text: "I'm analyzing the data based on your query: \"" + userMsg + "\". Please ensure all patient vitals are up to date for accurate assessment.",
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }, 1000);
  }
}
