import {
  camelCase,
  clone,
  get,
  isPlainObject,
  random,
  range,
  set,
  toPath
} from "lodash-es"

/**
 * Modifies all not inherited object keys using provided handler, does not mutate initial object
 * @param object - source object
 * @param [handler=camelCase] - function that would be applied 2 each own object key
 * @returns object with camelCase keys
 */
export function changeKeys(
  object: {[id: string]: unknown},
  handler: (key: string) => string = camelCase
): {[id: string]: unknown} {
  return Object.entries(object).reduce(
    (accumulator: {[id: string]: unknown}, [key, value]) => {
      accumulator[handler(key)] = value
      return accumulator
    },
    {}
  )
}

type ChangeKeysDeepSourceObject =
  | {
      [id: string]:
        | {[id: string]: ChangeKeysDeepSourceObject}
        | ChangeKeysDeepSourceObject[]
        | unknown
    }
  | ChangeKeysDeepSourceObject[]

/**
 * Recursively modifies all enumerable and not inherited object keys using provided handler
 * Does not mutate initial object
 * @param object - source object or array
 * @param [handler=camelCase] - function applied 2 each own object key
 * @returns object with camelCase keys or array with processed values
 */
export function changeKeysDeep(
  object: ChangeKeysDeepSourceObject | ChangeKeysDeepSourceObject[],
  handler: (key: string) => string = camelCase
): ChangeKeysDeepSourceObject {
  const processValue = (
    value: ChangeKeysDeepSourceObject | ChangeKeysDeepSourceObject[] | unknown
  ): ChangeKeysDeepSourceObject =>
    isPlainObject(value) || Array.isArray(value)
      ? changeKeysDeep(
          value as ChangeKeysDeepSourceObject | ChangeKeysDeepSourceObject[],
          handler
        )
      : (value as ChangeKeysDeepSourceObject)

  return Array.isArray(object)
    ? object.map(value => processValue(value))
    : Object.entries(object).reduce(
        (
          accumulator: {[id: string]: ChangeKeysDeepSourceObject},
          [key, value]
        ) => {
          accumulator[handler(key)] = processValue(value)
          return accumulator
        },
        {}
      )
}

/**
 * Get all nested objects keys
 * @param object - source nested objects
 * @param keys - list of paths to nested objects
 * @returns set of nested object keys
 */
export function getAllNestedKeys(
  object: {[id: string]: unknown},
  keys: string[] | string[][]
): Set<string> {
  const nestedKeys: Set<string> = new Set()
  for (const path of keys)
    for (const key of Object.keys(get(object, path, {}))) nestedKeys.add(key)

  return nestedKeys
}

/**
 * Join strings without doubling separator
 * @param chunks - Array of strings to join
 * @param separator - string joining array
 * @param [options] - algorithm options
 * @param [options.leading=false] - append leading separator
 * @param [options.trailing=false] - append trailing separator
 * @returns Chunks, joined by separator
 */
export function joinStrings(
  chunks: string[],
  separator: string,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {}
): string {
  let result = chunks
    .filter(Boolean)
    .map((chunk, index, array) => {
      if (index !== 0 && chunk.startsWith(separator))
        chunk = chunk.slice(separator.length)
      if (index !== array.length - 1 && chunk.endsWith(separator))
        chunk = chunk.slice(0, -separator.length)
      return chunk
    })
    .join(separator)

  if (options.leading && !result.startsWith(separator))
    result = separator + result
  if (options.trailing && !result.endsWith(separator)) result += separator

  return result
}

/**
 * Format number by rounding it and adding \s separators in the integer part
 * @param number - Number to format (it may be a string, containing number)
 * @param [precision=2] - The precision to round provided number to
 * @returns Formatted string, containing source number
 */
export function formatLongNumber(
  number: number | string,
  precision = 2
): string {
  const convertedNumber = Number(number)
  if ((typeof number !== "number" && !number) || isNaN(convertedNumber))
    return ""

  const numberChunks = convertedNumber.toFixed(precision).split(".")
  numberChunks[0] = numberChunks[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, " ")
  return numberChunks.join(".")
}

/**
 * Calculate capacity of array of ranges
 * @param rangeList - Array of ranges to process
 * @param [gap=0] - Minimal gap between each generated items
 * @returns Nested range capacity
 */
export function calculateNestedRangeCapacity(
  rangeList: number[][],
  gap = 0
): number {
  return (
    rangeList.reduce(
      (accumulator, sourceRange) =>
        accumulator + Math.abs(sourceRange.reduce((a, b) => a - b)),
      0
    ) /
    (gap * 2 + 1)
  )
}

/**
 * Generate an Array of uniq random numbers from provided range.
 * @param {number[]|number[][]} sourceRange - Range or Array of ranges limiting numbers generation.
 *                                      If provided as Array of ranges source array will be mutated
 * @param {number} count - Count of numbers to generate
 * @param {number} [gap=0] - Minimal gap between generated numbers
 * @returns {number[]} - Array of uniq random numbers
 */
export function generateRandomSequenceFromRange(
  sourceRange: Array<number | number[]>,
  count: number,
  gap = 0
) {
  const rangeList = (
    sourceRange.every(item => typeof item === "number")
      ? [sourceRange]
      : sourceRange
  ) as number[][]
  const rangeCapacity = calculateNestedRangeCapacity(rangeList, gap)
  if (rangeCapacity < count)
    throw new Error("Range is too short for given count generation")
  const output = []

  while (output.length < count) {
    const selectedRangeIndex =
      rangeList.length > 1 ? random(rangeList.length - 1) : 0
    const selectedRange = rangeList[selectedRangeIndex]
    // Incorrect typing for random,
    // see doc: https://lodash.com/docs/#random
    const item = (random as (start: number, end?: number) => number)(
      ...(selectedRange as [number, number])
    )
    output.push(item)

    const newRanges: number[][] = []
    if (selectedRange[0] < item - gap)
      newRanges.push([selectedRange[0], item - gap])
    if (selectedRange[1] > item + gap)
      newRanges.push([item + gap, selectedRange[1]])

    rangeList.splice(selectedRangeIndex, 1, ...newRanges)
  }

  return output
}

/**
 * Insert object after between all array child object
 * @param array - source array
 * @param insertion - object to insert
 * @returns object with multiple insertions
 */
export function joinArrayBy(array: unknown[], insertion: unknown) {
  for (const index of range(1, array.length * 2 - 1, 2))
    array.splice(index, 0, insertion)

  return array
}

/**
 * Detect JSON structure in the string
 * @param {string} source - source string, that may contain JSON structure
 * @returns {boolean} - is string contain JSON
 */
export function isJSON(source: string): boolean {
  try {
    const parsed = JSON.parse(source)
    return (
      typeof parsed === "boolean" ||
      Array.isArray(parsed) ||
      isPlainObject(parsed)
    )
  } catch {
    return false
  }
}

/**
 * Clone tree inside the object
 * @param {object} obj - source object
 * @param {string | string[]} path - lodash path to copy
 * @returns {object} - source object with cloned tree
 */
export function clonePath(
  obj: {[id: string]: {[id: string]: unknown} | unknown[] | unknown},
  path: string | string[]
): {[id: string]: unknown} | unknown[] | unknown {
  if (typeof path === "string") path = toPath(path)
  obj = clone(obj)

  for (let index = 0; index < path.length; index++) {
    const currentPath = path.slice(0, index)
    set(obj, currentPath, clone(get(obj, currentPath)))
  }

  return obj
}
