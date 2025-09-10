const tokenBlocklist = new Set<string>()

export function addToBlocklist(token: string) {
  tokenBlocklist.add(token)
}

export function isBlockListed(token: string): boolean {
  return tokenBlocklist.has(token)
}
