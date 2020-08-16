export class GenericType {
  private _getType: (types: { [key: string]: any }) => any
  constructor(getType: (types: { [key: string]: any }) => any) {
    this._getType = getType
  }
  public getActualType(types: { [key: string]: any }): any {
    return this._getType(types)
  }
}

export const GenericParam = (getType: ((...types: any[]) => any) | string): GenericType => {
  if (typeof getType === 'string') {
    const getActualType = (types: { [key: string]: any }) => {
      return types[getType]
    }
    return new GenericType(getActualType)
  } else {
    return new GenericType(getType)
  }
}
