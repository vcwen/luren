export class IncomingFile {
  public size: number
  public path: string
  public name: string
  public type: string
  public hash?: string
  constructor(name: string, path: string, type: string, size: number) {
    this.name = name
    this.path = path
    this.type = type
    this.size = size
  }
}
