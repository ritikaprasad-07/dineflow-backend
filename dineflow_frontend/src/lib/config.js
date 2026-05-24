// Env-derived branding values used by the printed receipt.
// import.meta.env values are baked at build time — rebuild after editing .env.local.

export const config = {
    restaurantName: import.meta.env.VITE_RESTAURANT_NAME || 'Spice Craft',
    restaurantLocation: import.meta.env.VITE_RESTAURANT_LOCATION || 'Mumbai · Maharashtra',
}