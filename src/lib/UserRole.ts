interface IPermission {
  recursive: boolean
  mode: string
  scope: {
    [key: string]: IPermission
  }
}
class UserRole {
  public name: string
  public permission: IPermission
  public description?: string
  constructor(name: string, permission: IPermission) {
    this.name = name
    this.permission = permission
  }
}
