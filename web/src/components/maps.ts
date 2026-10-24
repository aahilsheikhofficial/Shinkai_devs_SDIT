// Google Maps config. The key lives in web/.env (never commit it).
export const MAPS_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
export const MAP_ID: string = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'
export const hasMapsKey = MAPS_KEY.length > 20 && !MAPS_KEY.startsWith('your-')
