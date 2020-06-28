import { StreamResponse } from './StreamResponse'
import fs from 'fs'

export class FileResponse extends StreamResponse {
  constructor(filepath: string, options?: { filename?: string; download?: boolean; mime?: string }) {
    const fileStream = fs.createReadStream(filepath)
    super(fileStream, options)
  }
}
