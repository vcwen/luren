import { normalizeSimpleSchema } from '../../src/lib/utils'

describe('normalizeSimpleSchema', () => {
  it('should normalize primitives', () => {
    expect(normalizeSimpleSchema('string')).toEqual({ type: 'string' })
    expect(normalizeSimpleSchema('number')).toEqual({ type: 'number' })
  })
  it('should normalize object', () => {
    const schema = normalizeSimpleSchema({ username: 'string', password: 'string', email: 'string?', id: 'number' })
    expect(schema).toEqual({
      type: 'object',
      properties: {
        username: {
          type: 'string'
        },
        password: {
          type: 'string'
        },
        email: {
          type: 'string'
        },
        id: {
          type: 'number'
        }
      },
      required: ['username', 'password', 'id']
    })
  })
})
