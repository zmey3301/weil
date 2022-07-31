import {camelCase, snakeCase} from "lodash-es"

import {isJSON} from "./common"

const DJANGO_QUERY_JOIN_SYMBOL = "__"

export interface QueryProcessingOptions {
  formatKey?: boolean
  flatArray?: boolean
  preserveJoins?: boolean
  detectJSON?: boolean
  detectNumber?: boolean
}

export type QueryBaseValue = string | number | boolean | unknown

export type QueryParams = {
  [id: string]: QueryBaseValue | (string | number | unknown)[]
}

/**
 * Generates url query string from key-val object
 * @param params - query params object
 * @param [options] - generate query options
 * @param [options.formatKey=true] - snakeCase key conversion toggle
 * @param [options.flatArray=false] - flat array params toggle
 * @param [options.preserveJoins=false] - Preserve django joins formatting
 * @returns query params string
 * @example
 *
 * generateQuery({q: "asd", page: 10, perPage: 5, test__lte: 999})
 * // => "?q=asd&page=10&per_page=5&test_lte=999"
 * @example
 *
 * generateQuery({q: ["asd", "qwe"]})
 * // => "?q=asd,qwe"
 * @example
 *
 * generateQuery({q: ["asd", "qwe"]}, {flatArray: true})
 * // => "?q=asd&q=qwe"
 * @example
 *
 * generateQuery({test__lte: 999, perPage: 5}, {formatKey: false})
 * // => "?test__lte=999&perPage=5"
 * @example
 *
 * generateQuery({test__lte: 999, perPage: 5}, {preserveJoins: true})
 * // => "?test__lte=999&per_page=5"
 */
export function generateQuery(
  params: QueryParams,
  options: Omit<QueryProcessingOptions, "detectJSON" | "detectNumber">
): string {
  options = {
    formatKey: true,
    flatArray: false,
    preserveJoins: false,
    ...options
  }
  const formatKey = (key: string) =>
    options.formatKey &&
    (!options.preserveJoins || !key.includes(DJANGO_QUERY_JOIN_SYMBOL))
      ? snakeCase(key)
      : key

  // @ts-ignore
  const paramsString = Object.entries(params)
    [options.flatArray ? "flatMap" : "map"](
      ([key, value]: [string, QueryBaseValue]) => {
        /* eslint-disable no-shadow */
        const createPair = (key: string, value: QueryBaseValue) =>
          `${formatKey(key)}=${encodeURIComponent(
            typeof value !== "string" ? JSON.stringify(value) : value
          )}`
        /*eslint-enable no-shadow */
        if (value === true) return formatKey(key)
        else if (!value && value !== 0) return null

        // FIXME: no nested array support
        if (Array.isArray(value)) {
          if (options.flatArray) return value.map(item => createPair(key, item))
          else value = value.join(",")
        }

        return value || value === 0 ? createPair(key, value) : null
      }
    )
    .filter((entry: string | boolean) => typeof entry === "string" && entry)
    .join("&")

  return `?${paramsString}`
}

/**
 * Parses url query to plain JS object
 * @param query - source query string
 * @param [options] - generate query options
 * @param [options.formatKey=true] - camelCase key conversion toggle
 * @param [options.detectJSON=true] - JSON structure detection & parse toggle
 * @param [options.detectNumber=false] - Detect and parse stringify numbers
 * @param [options.preserveJoins=false] - Preserve django joins formatting
 * @returns query params object
 */
export function parseQuery(
  query: string,
  options: Omit<QueryProcessingOptions, "flatArray">
) {
  options = {
    formatKey: true,
    preserveJoins: false,
    detectJSON: true,
    detectNumber: false,
    ...options
  }

  if (query.startsWith("?")) query = query.slice(1)

  return query
    .split("&")
    .filter(entry => entry)
    .map((entry): [string, QueryBaseValue] => {
      const [key, value] = entry.split("=")
      let parsedValue: QueryBaseValue =
        typeof value !== "undefined" ? decodeURIComponent(value) : true

      if (
        options.detectJSON &&
        typeof parsedValue === "string" &&
        isJSON(parsedValue)
      )
        parsedValue = JSON.parse(parsedValue)
      if (
        options.detectNumber &&
        typeof parsedValue === "string" &&
        !isNaN(Number(parsedValue))
      )
        parsedValue = Number(parsedValue)

      return [
        options.formatKey &&
        (!options.preserveJoins || !key.includes(DJANGO_QUERY_JOIN_SYMBOL))
          ? camelCase(key)
          : key,
        parsedValue
      ]
    })
    .reduce(
      (accumulator: QueryParams, [key, value]: [string, QueryBaseValue]) => {
        if (Object.hasOwn(accumulator, key)) {
          accumulator[key] = ([] as QueryBaseValue[]).concat(
            accumulator[key],
            value
          )
        } else accumulator[key] = value

        return accumulator
      },
      {}
    )
}

/**
 * Get updated variant of current query string
 * @param {{string: any}} patch - Plain Object that contains query patch data
 * @param [options] - generate query options
 * @param [options.search=location.search] - source query string
 * @param [options.formatKey=true] - camelCase key conversion toggle
 * @param [options.flatArray=false] - flat array params toggle
 * @param [options.preserveJoins=false] - Preserve django joins formatting
 * @returns Patched query string
 */
export function patchQuery(
  patch: QueryParams,
  options: QueryProcessingOptions & {search?: Location["search"]}
) {
  options = {
    search: window.location.search,
    formatKey: true,
    preserveJoins: false,
    flatArray: false,
    ...options
  }
  const initialQuery = parseQuery(options.search!, options)
  return generateQuery(Object.assign(initialQuery, patch), options)
}
