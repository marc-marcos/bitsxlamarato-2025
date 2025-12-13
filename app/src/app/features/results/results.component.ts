import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AnalysisService } from '../../core/analysis/analysis.service';
import { ChatbotComponent } from '../dashboard/components/chatbot/chatbot.component';
import { RiskReportComponent } from '../dashboard/components/risk-report/risk-report.component';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    ChatbotComponent,
    RiskReportComponent
  ],
  template: `
    <div class="flex h-full overflow-hidden">
      <!-- Center: Risk Report -->
      <main class="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div class="max-w-4xl mx-auto h-full">
          <app-risk-report [data]="analysisData"></app-risk-report>
        </div>
      </main>

      <!-- Right Sidebar: AI Chatbot -->
      <aside class="w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm z-0">
        <app-chatbot [analysisData]="analysisData"></app-chatbot>
      </aside>
    </div>
  `
})
export class ResultsComponent implements OnInit {
  analysisData: any;

  constructor(private readonly analysisService: AnalysisService) {}

  ngOnInit(): void {
    this.analysisData = this.analysisService.getAnalysisData();
  }
}
