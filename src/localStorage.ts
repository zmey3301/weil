/**
 * Save data to LocalStorage
 * @param name - LocalStorage entry name
 * @param data - LocalStorage entry value
 */
export function set(name: string, data: unknown) {
  window.localStorage.setItem(name, JSON.stringify(data))
}

/**
 * Get data from LocalStorage
 * @param name - LocalStorage entry name
 * @returns LocalStorage entry value
 */
export function get(name: string): unknown | null {
  const value = window.localStorage.getItem(name)
  return value ? JSON.parse(value) : null
}

/**
 * Remove data from LocalStorage
 * @param name - LocalStorage entry name
 */
export function remove(name: string) {
  window.localStorage.removeItem(name)
}
