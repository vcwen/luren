export default abstract class Authorization {
  public abstract async authorize(...args: any[]): Promise<boolean>
}
