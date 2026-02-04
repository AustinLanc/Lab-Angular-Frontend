import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductName, MonthlyBatch, TestingData, QcLog, Retain } from './models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Product endpoints
  getProducts(): Observable<ProductName[]> {
    return this.http.get<ProductName[]>(`${this.baseUrl}/products`);
  }

  getProductByCode(code: number): Observable<ProductName> {
    return this.http.get<ProductName>(`${this.baseUrl}/products/${code}`);
  }

  searchProducts(name: string): Observable<ProductName[]> {
    return this.http.get<ProductName[]>(`${this.baseUrl}/products/search`, {
      params: { name }
    });
  }

  createProduct(product: ProductName): Observable<ProductName> {
    return this.http.post<ProductName>(`${this.baseUrl}/products`, product);
  }

  updateProduct(code: number, product: ProductName): Observable<ProductName> {
    return this.http.put<ProductName>(`${this.baseUrl}/products/${code}`, product);
  }

  deleteProduct(code: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${code}`);
  }

  // Batch endpoints
  getBatches(): Observable<MonthlyBatch[]> {
    return this.http.get<MonthlyBatch[]>(`${this.baseUrl}/batches`);
  }

  getBatchByBatch(batch: string): Observable<MonthlyBatch> {
    return this.http.get<MonthlyBatch>(`${this.baseUrl}/batches/${batch}`);
  }

  getBatchesByCode(code: number): Observable<MonthlyBatch[]> {
    return this.http.get<MonthlyBatch[]>(`${this.baseUrl}/batches/code/${code}`);
  }

  getBatchesByType(type: string): Observable<MonthlyBatch[]> {
    return this.http.get<MonthlyBatch[]>(`${this.baseUrl}/batches/type/${type}`);
  }

  getBatchesByReleased(released: string): Observable<MonthlyBatch[]> {
    return this.http.get<MonthlyBatch[]>(`${this.baseUrl}/batches/released/${released}`);
  }

  getBatchesByDateRange(start: string, end: string): Observable<MonthlyBatch[]> {
    return this.http.get<MonthlyBatch[]>(`${this.baseUrl}/batches/daterange`, {
      params: { start, end }
    });
  }

  createBatch(batch: MonthlyBatch): Observable<MonthlyBatch> {
    return this.http.post<MonthlyBatch>(`${this.baseUrl}/batches`, batch);
  }

  updateBatch(batchId: string, batch: MonthlyBatch): Observable<MonthlyBatch> {
    return this.http.put<MonthlyBatch>(`${this.baseUrl}/batches/${batchId}`, batch);
  }

  deleteBatch(batch: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/batches/${batch}`);
  }

  // Testing Data endpoints
  getTestingData(): Observable<TestingData[]> {
    return this.http.get<TestingData[]>(`${this.baseUrl}/testing`);
  }

  getTestingDataByBatch(batch: string): Observable<TestingData> {
    return this.http.get<TestingData>(`${this.baseUrl}/testing/${batch}`);
  }

  getTestingDataByCode(code: string): Observable<TestingData[]> {
    return this.http.get<TestingData[]>(`${this.baseUrl}/testing/code/${code}`);
  }

  searchTestingData(batch: string): Observable<TestingData[]> {
    return this.http.get<TestingData[]>(`${this.baseUrl}/testing/search`, {
      params: { batch }
    });
  }

  getTestingDataByDate(date: string): Observable<TestingData[]> {
    return this.http.get<TestingData[]>(`${this.baseUrl}/testing/date/${date}`);
  }

  getTestingDataByDateRange(start: string, end: string): Observable<TestingData[]> {
    return this.http.get<TestingData[]>(`${this.baseUrl}/testing/daterange`, {
      params: { start, end }
    });
  }

  createTestingData(data: TestingData): Observable<TestingData> {
    return this.http.post<TestingData>(`${this.baseUrl}/testing`, data);
  }

  updateTestingData(batch: string, data: TestingData): Observable<TestingData> {
    return this.http.put<TestingData>(`${this.baseUrl}/testing/${batch}`, data);
  }

  deleteTestingData(batch: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/testing/${batch}`);
  }

  // QC Log endpoints
  getQcLogs(): Observable<QcLog[]> {
    return this.http.get<QcLog[]>(`${this.baseUrl}/qc`);
  }

  getQcLogByBatch(batch: string): Observable<QcLog> {
    return this.http.get<QcLog>(`${this.baseUrl}/qc/${batch}`);
  }

  getQcLogsByCode(code: string): Observable<QcLog[]> {
    return this.http.get<QcLog[]>(`${this.baseUrl}/qc/code/${code}`);
  }

  getQcLogsByReleasedBy(releasedBy: string): Observable<QcLog[]> {
    return this.http.get<QcLog[]>(`${this.baseUrl}/qc/releasedby/${releasedBy}`);
  }

  searchQcLogs(batch: string): Observable<QcLog[]> {
    return this.http.get<QcLog[]>(`${this.baseUrl}/qc/search`, {
      params: { batch }
    });
  }

  createQcLog(qcLog: QcLog): Observable<QcLog> {
    return this.http.post<QcLog>(`${this.baseUrl}/qc`, qcLog);
  }

  updateQcLog(batch: string, qcLog: QcLog): Observable<QcLog> {
    return this.http.put<QcLog>(`${this.baseUrl}/qc/${batch}`, qcLog);
  }

  deleteQcLog(batch: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/qc/${batch}`);
  }

  // Retain endpoints
  getRetains(): Observable<Retain[]> {
    return this.http.get<Retain[]>(`${this.baseUrl}/retains`);
  }

  getRetainById(id: number): Observable<Retain> {
    return this.http.get<Retain>(`${this.baseUrl}/retains/${id}`);
  }

  getRetainsByBatch(batch: string): Observable<Retain[]> {
    return this.http.get<Retain[]>(`${this.baseUrl}/retains/batch/${batch}`);
  }

  getRetainsByCode(code: number): Observable<Retain[]> {
    return this.http.get<Retain[]>(`${this.baseUrl}/retains/code/${code}`);
  }

  getRetainsByBox(box: number): Observable<Retain[]> {
    return this.http.get<Retain[]>(`${this.baseUrl}/retains/box/${box}`);
  }

  searchRetains(batch: string): Observable<Retain[]> {
    return this.http.get<Retain[]>(`${this.baseUrl}/retains/search`, {
      params: { batch }
    });
  }

  getRetainsByDateRange(start: string, end: string): Observable<Retain[]> {
    return this.http.get<Retain[]>(`${this.baseUrl}/retains/daterange`, {
      params: { start, end }
    });
  }

  createRetain(retain: Retain): Observable<Retain> {
    return this.http.post<Retain>(`${this.baseUrl}/retains`, retain);
  }

  updateRetain(id: number, retain: Retain): Observable<Retain> {
    return this.http.put<Retain>(`${this.baseUrl}/retains/${id}`, retain);
  }

  deleteRetain(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/retains/${id}`);
  }
}
