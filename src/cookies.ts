import {defaults, escapeRegExp, kebabCase} from "lodash-es"

export interface CookieParams {
  expires?: string | number
  sameSite?: "Lax" | "Strict" | "None"
  maxAge?: number
  path?: string
  domain?: string
  secure?: boolean
}

/**
 * Get cookie by name
 * @param name - Cookie name
 * @returns Cookie content or nothing
 */
export function getCookie(name: string): string | null {
  const escapedName = escapeRegExp(encodeURIComponent(name))
  const re = new RegExp(`(?:^|; )${escapedName}=([^;]*)`)
  const content = document.cookie.match(re)
  return content ? decodeURIComponent(content[1]) : null
}

/**
 * Set cookie
 * @param cookie - Cookie name
 * @param cookieContent - Cookie content
 * @param [params=object] - Cookie params
 * @param [params.expires] - Cookie expiration date
 * @param [params.sameSite=Lax] - Cookie XSRF policy
 * @param [params.maxAge] - Cookie relative lifetime, replaces expires
 * @param [params.path] - Cookie path
 * @param [params.domain] - Cookie domain
 * @param [params.secure] - HTTPS-only cookie toggle
 */
export function setCookie(
  cookie: string,
  cookieContent: string,
  params: CookieParams = {}
) {
  params = defaults(params, {
    sameSite: "Lax"
  })
  if (typeof params.expires === "number") {
    const today = new Date()
    today.setTime(today.getTime() + params.expires * 1000)
    params.expires = today.toUTCString()
  }

  const dataTpl = (name, value) => `${name}=${value}`
  const [encodedCookie, encodedCookieContent] = [cookie, cookieContent].map(
    encodeURIComponent
  )
  const data = [dataTpl(encodedCookie, encodedCookieContent)]

  for (const [paramName, paramVal] of Object.entries(params))
    if (paramVal === true) data.push(kebabCase(paramName))
    else if (typeof paramVal !== "boolean")
      data.push(dataTpl(kebabCase(paramName), paramVal))
  document.cookie = data.join(";")
}

/**
 * Remove cookie
 * @param {string} name - Cookie name
 * @param {string} [path="/"] - cookie path
 */
export function deleteCookie(name: string, path: CookieParams["path"] = "/") {
  setCookie(name, "", {path, expires: -1})
}
