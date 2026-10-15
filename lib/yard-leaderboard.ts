import { DREXEL_LOCATIONS } from "@/lib/locations";

export interface YardStanding {
  locationId: string;
  totalPoints: number;
}

export function rankYards(totals: ReadonlyMap<string, unknown>): YardStanding[] {
  return DREXEL_LOCATIONS.map((locationId) => {
    const points = totals.get(locationId);
    return {
      locationId,
      totalPoints: typeof points === "number" && Number.isFinite(points) && points >= 0 ? points : 0,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
}
