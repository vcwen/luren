import { SimpleType } from 'luren-schema'

export class GenericType {
  private _getType: (types: { [key: string]: any }) => SimpleType
  private _defaultType?: SimpleType
  constructor(getType: (types: { [key: string]: any }) => SimpleType, defaultType?: SimpleType) {
    this._getType = getType
    this._defaultType = defaultType
  }
  public getActualType(types: { [key: string]: any }): any {
    return this._getType(types) ?? this._defaultType
  }
}

export const GenericParam = (getType: ((...types: any[]) => any) | string, defaultType?: SimpleType): GenericType => {
  if (typeof getType === 'string') {
    const getActualType = (types: { [key: string]: any }) => {
      return types[getType]
    }
    return new GenericType(getActualType, defaultType)
  } else {
    return new GenericType(getType, defaultType)
  }
}
