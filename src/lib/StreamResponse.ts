import { Stream } from 'stream'
import { HttpHeader, HttpStatusCode } from '../constants'
import { HttpResponse } from './HttpResponse'

export class StreamResponse extends HttpResponse {
  public set filename(filename: string | undefined) {
    this._filename = filename
    this.download = true
  }
  public get filename() {
    return this._filename
  }
  public stream?: Stream
  public mime?: string
  public download?: boolean
  private _filename?: string
  constructor(stream: Stream, options?: { filename?: string; download?: boolean; mime?: string }) {
    super(HttpStatusCode.OK, stream)
    this.stream = stream
    if (options) {
      this.mime = options.mime
      this.download = options.download
      this.filename = options.filename
      if (this.download) {
        if (this.filename) {
          this._addHeader(HttpHeader.Content_Disposition, `attachment; filename="${this.filename}"`)
        } else {
          this._addHeader(HttpHeader.Content_Disposition, 'attachment')
        }
      }
      if (this.mime) {
        this._addHeader('Content-Type', this.mime)
      }
    }
    this.body = stream
  }
  private _addHeader(key: string, value: string) {
    if (!this.headers) {
      this.headers = {}
    }
    this.headers[key] = value
  }
}
