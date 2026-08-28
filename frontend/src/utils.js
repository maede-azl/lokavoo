export function mapBusiness(data = {}) {
  return {
    id: data.id ?? "",
    name: data.name ?? "بدون نام",
    category: data.category ?? "نامشخص",
    rating: data.rating ?? 0,
    reviews: data.reviews?.length ?? data.reviews ?? 0,
    address: data.address ?? "",
    distance: data.distance ?? "",
    phone: data.phone ?? "",
    open: data.open ?? false,
    openTime: data.openTime ?? "",
    closeTime: data.closeTime ?? "",
    emoji: data.emoji ?? "🏪",
    images: Array.isArray(data.images) ? data.images : [],
    description: data.description ?? "",
    lat: data.lat,
    lng: data.lng,
  };
}