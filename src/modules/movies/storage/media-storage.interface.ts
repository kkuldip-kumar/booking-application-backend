export interface MediaStorage {
  /** Stores the object and returns its public URL. */
  save(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}
