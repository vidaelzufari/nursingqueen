import { sleepReferenceHours } from "@/domain/ageReference";
const now = new Date(2026,10,8,12);
it("uses completed-month sleep ranges without inventing newborn nap targets", () => {
 expect(sleepReferenceHours("2026-07-09",now)).toBeNull();
 expect(sleepReferenceHours("2026-07-08",now)).toEqual({min:12,max:16});
 expect(sleepReferenceHours("2025-11-08",now)).toEqual({min:11,max:14});
 expect(sleepReferenceHours("bad",now)).toBeNull();
 expect(sleepReferenceHours("2027-01-01",now)).toBeNull();
});
