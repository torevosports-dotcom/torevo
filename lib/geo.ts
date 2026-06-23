// Lightweight maps helpers — no Google API key/billing. We just deep-link to the
// Google Maps app/site and compute straight-line distance locally.

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function destination(loc: { venue_name?: string; city?: string; lat?: number; lng?: number } | undefined): string {
  if (!loc) return ''
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') return `${loc.lat},${loc.lng}`
  return encodeURIComponent([loc.venue_name, loc.city].filter(Boolean).join(', '))
}

// Opens Google Maps centered on the venue (coords if we have them, else a text search).
export function mapViewUrl(loc: any): string {
  return `https://www.google.com/maps/search/?api=1&query=${destination(loc)}`
}

// Opens Google Maps turn-by-turn directions to the venue.
export function directionsUrl(loc: any): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination(loc)}`
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`
  if (km < 10) return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}
