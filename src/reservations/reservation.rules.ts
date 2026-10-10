// Pure business rules: no database, no HTTP. Easy to unit test.

export interface TimeRange {
  startsAt: Date;
  endsAt: Date;
}

// Two time ranges overlap if each one starts before the other ends.
// Ranges that only touch (one ends exactly when the other starts) do NOT overlap.
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  // TODO: una sola línea con return.
  // "a empieza antes de que b termine" Y "b empieza antes de que a termine"
    return a.startsAt < b.endsAt && b.startsAt < a.endsAt;  
    
}