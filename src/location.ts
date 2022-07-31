import {rad} from "./geometry"

export interface GeoJSONPolygon {
  type: "Polygon" | "POLYGON" | "polygon"
  coordinates: number[][][]
}

export interface GoogleMapsPoint {
  lat: number
  lng: number
}

export interface GoogleMapsBoundary {
  northeast: GoogleMapsPoint
  southwest: GoogleMapsPoint
}

/**
 * Increase latitude and longitude degrees boundary by radius in miles
 * @param {object} location - boundary coordinates object
 * @param {object} location.northeast - northeast point of boundary
 * @param {object} location.southwest - southwest point of boundary
 * @param {number} location.northeast.lat - north coordinate
 * @param {number} location.northeast.lng - east coordinate
 * @param {number} location.southwest.lat - south coordinate
 * @param {number} location.southwest.lng - west coordinate
 * @param {number} radius - increase radius in miles
 * @returns {{southwest: {lng: number, lat: number}, northeast: {lng: number, lat: number}}} increased boundary
 *
 *
 * FIXME: this algorithm is really rough, starting from 2 miles per degree lat divergence
 *        and ending by possibly wrong lng range increase
 *        as we don't recalculate increment length in degree on lng points sort change
 *        which commonly happens if we have 180 degree overlap after radius increase.
 *        #
 *        Possible solution is to add degree from equator miles instead of calculated,
 *        sort coords and only then add coefficient according to point's lat value.
 *        But it still pretty rough anyway.
 *        #
 *        Now we don't care about this, but it's still good to know.
 */
export function increaseBoundary(
  location: GoogleMapsBoundary,
  radius: number
): GoogleMapsBoundary {
  /**
   * Process 90/180 deg overlaps
   * @param {number} degree - minmax degree
   * @returns {function(number): number} source degree processing func
   */
  function normalizeDegree(degree: number): (source: number) => number {
    return (source: number) =>
      (source % degree) * Math.pow(-1, Math.floor(Math.abs(source / degree)))
  }

  const approxLatDegreeMiles = 69

  const lats = [location.northeast.lat, location.southwest.lat]
    .map(
      (lat, index) =>
        lat +
        (radius / approxLatDegreeMiles) *
          (index === 0 ? 1 : -1) *
          (lat / Math.abs(lat))
    )
    .map(normalizeDegree(90))
    .sort((a, b) => b - a)

  const [north, south] = lats

  const [east, west] = [location.northeast.lng, location.southwest.lng]
    .map(
      (lng, index) =>
        lng +
        (radius / (Math.cos(rad(lats[index])) * approxLatDegreeMiles)) *
          (index === 0 ? 1 : -1) *
          (lng / Math.abs(lng))
    )
    .map(normalizeDegree(180))
    .sort((a, b) => b - a)

  return {
    northeast: {
      lat: north,
      lng: east
    },
    southwest: {
      lat: south,
      lng: west
    }
  }
}

/**
 * Get approximate viewport from GeoJSON polygon
 * @param {{
 *   "type": "Polygon"|"POLYGON",
 *   "coordinates": number[][][]
 * }} polygon - source polygon
 * @returns {{"northeast": {"lat": number, "lng": number}, "southwest": {"lat": number, "lng": number}}} polygon viewport
 */
export function getViewportFromPolygon(
  polygon: GeoJSONPolygon
): GoogleMapsBoundary {
  const keys = ["lng", "lat"]

  const values = Object.fromEntries(
    keys.map((key, index) => [
      key,
      polygon.coordinates[0].map(point => point[index])
    ])
  )

  return Object.fromEntries(
    [
      ["northeast", "max"],
      ["southwest", "min"]
    ].map(([point, method]) => [
      point,
      Object.fromEntries(
        keys.map(coordinate => [
          coordinate,
          Math[method as "min" | "max"](...values[coordinate])
        ])
      )
    ])
  ) as unknown as GoogleMapsBoundary
}

/**
 * Get approximate polygon center
 * WARNING: this algorithm returns robust values only on rectangles
 *          and shouldn't be used for precise center calculation
 * @param {{
 *   "type": "Polygon"|"POLYGON",
 *   "coordinates": number[][][]
 * }} polygon - source polygon
 * @returns {{"lat": number, "lng": number}} - approximate center point
 */
export function getApproximatePolygonCenter(
  polygon: GeoJSONPolygon
): GoogleMapsPoint {
  const keys = ["lng", "lat"]
  const {northeast, southwest} = getViewportFromPolygon(polygon)

  return Object.fromEntries(
    keys.map(key => [
      key,
      (northeast[key as "lat" | "lng"] - southwest[key as "lat" | "lng"]) / 2 +
        southwest[key as "lat" | "lng"]
    ])
  ) as unknown as GoogleMapsPoint
}
