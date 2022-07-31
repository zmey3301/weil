import {clone, isNil} from "lodash-es"

export const relativeTime = {
  seconds(amount: number): number {
    return amount * 1000
  },
  minutes(amount: number): number {
    return amount * this.seconds(60)
  },
  hours(amount: number): number {
    return amount * this.minutes(60)
  },
  days(amount: number): number {
    return amount * this.hours(24)
  },
  weeks(amount: number): number {
    return amount * this.days(7)
  },
  months(amount: number): number {
    return amount * this.days(30)
  },
  years(amount: number): number {
    return amount * this.days(365)
  }
}

/**
 * Clamp date object between two dates
 * @param date - date to check
 * @param [minDate] - date minimum value
 * @param [maxDate] - date maximum value
 * @returns- clamped value
 */
export function clampDate(date: Date, minDate: Date, maxDate: Date) {
  if (!isNil(maxDate) && Number(date) > Number(maxDate)) return clone(maxDate)
  if (!isNil(minDate) && Number(date) < Number(minDate)) return clone(minDate)
  return date
}
