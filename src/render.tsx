import React, {ReactElement} from "react"

/**
 * Pluralize word's based on amount
 * @param amount - amount of items
 * @param denomination - items denomination
 * @param [pluralEnding="s"] - plural ending
 * @returns pluralized denomination
 */
export function pluralize(
  amount: number,
  denomination: string,
  pluralEnding = "s"
): string {
  return amount % 10 === 1 && amount % 100 !== 11
    ? denomination
    : `${denomination}${pluralEnding}`
}

/**
 * Calculate scrollbar width
 * @returns  scrollbar width in pixels (rounded)
 */
export function getScrollWidth(): number {
  const wrap = document.createElement("div")

  const child = wrap.cloneNode() as HTMLDivElement

  wrap.style.cssText =
    "width:100px;height:1px;z-index:-1;opacity:0;pointer-events:none;position:absolute;overflow:scroll;"
  child.style.cssText = "height:10px"
  wrap.appendChild(child)
  document.documentElement.appendChild(wrap)

  const result = wrap.offsetWidth - child.offsetWidth

  wrap.remove()
  return result
}

/**
 * Transform all links in text to JSX
 * @param text - source message string
 * @param [className] - additional link className
 * @returns list with rendered JSX links
 */
export function parseLinks(
  text: string,
  className?: string
): (string | ReactElement)[] {
  const regexp =
    /https?:\/\/(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])|(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*\.[a-z\u00a1-\uffff]{2,})(?::\d{2,5})?(?:\/(:?[^ <>{}[\]\\|^`]+[^ <>{}[\]\\|^`,.?!])?)?/giu
  const body = []
  let match
  let prevIndex = 0
  while ((match = regexp.exec(text))) {
    body.push(
      match.input.slice(prevIndex, match.index),
      <a
        key={`${match[0]}-${match.index}`}
        className={className}
        href={match[0]}
        target="_blank"
        rel="noreferrer"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        {match[0]}
      </a>
    )
    prevIndex = match.index + match[0].length
  }
  body.push(text.slice(prevIndex))
  return body
}
