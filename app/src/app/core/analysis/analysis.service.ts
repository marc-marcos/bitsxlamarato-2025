import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private readonly analysisData = new BehaviorSubject<any>(null);
  readonly analysisData$ = this.analysisData.asObservable();

  setAnalysisData(data: any): void {
    this.analysisData.next(data);
  }

  getAnalysisData(): any {
    return this.analysisData.value;
  }
}
