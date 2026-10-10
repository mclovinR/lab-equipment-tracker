import { rangesOverlap } from "../src/reservations/reservation.rules";

// Helper: a range on the same day, from hour a to hour b.
function range(startHour: number, endHour: number) {
    return {
        startsAt: new Date(`2027-01-15T${String(startHour).padStart(2, "0")}:00:00Z`),
        endsAt: new Date(`2027-01-15T${String(endHour).padStart(2, "0")}:00:00Z`)
    };
}

describe("rangesOverlap", () => {
    const existing = range(10, 12);

    it("detects a range that starts inside the existing one", () => {
        expect(rangesOverlap(existing, range(11, 13))).toBe(true);
    });

    it("detects a range that ends inside the existing one", () => {
        expect(rangesOverlap(existing, range(9, 11))).toBe(true);
    });

    it("detects a range fully inside the existing one", () => {
        expect(rangesOverlap(existing, range(10, 11))).toBe(true);
    });

    it("detects a range that covers the existing one", () => {
        expect(rangesOverlap(existing, range(9, 13))).toBe(true);
    });

    it("allows a range that starts exactly when the existing one ends", () => {
        expect(rangesOverlap(existing, range(12, 14))).toBe(false);
    });

    it("allows a range that ends exactly when the existing one starts", () => {
        expect(rangesOverlap(existing, range(8, 10))).toBe(false);
    });

    
});