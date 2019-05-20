class UserRole {
  public name: string = ''
  public realm: string
  public role: string
  public description?: string
  constructor(role: string, realm?: string, name?: string) {
    this.role = role
    if (realm) {
      this.realm = realm
    } else {
      this.realm = ''
    }
    if (name) {
      this.name = name
    }
  }
}
