/**
 * Interface for Saga state storage
 */
export interface ISagaStateStore {
  save(sagaId: string, state: any): Promise<void>;
  get(sagaId: string): Promise<any | null>;
  update(sagaId: string, state: any): Promise<void>;
  delete(sagaId: string): Promise<void>;
}
