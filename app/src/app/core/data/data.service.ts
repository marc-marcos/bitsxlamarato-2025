import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly data = new BehaviorSubject<any>(null);
  readonly data$ = this.data.asObservable();

  setData(data: any): void {
    this.data.next(data);
  }

  getData(): any {
    return this.data.value;
  }
}
