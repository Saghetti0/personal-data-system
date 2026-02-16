import { Immutable, Note, Ordering, OrderingDirection, When } from "./types";

function strcmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareNotes(
  lhs: Immutable<Note>,
  rhs: Immutable<Note>,
  ordering: Immutable<Ordering>
): number {
  for (const { field, direction } of ordering) {
    const lhsVal = lhs.fields[field];
    const rhsVal = rhs.fields[field];

    if (lhsVal === undefined && rhsVal === undefined) continue;
    if (lhsVal === undefined) return -1;
    if (rhsVal === undefined) return 1;

    let cmp: number;
    if (field === "when") {
      // typescript can't infer this, sadly
      cmp = strcmp((lhsVal as When).timestamp, (rhsVal as When).timestamp);
    } else {
      cmp = strcmp(lhsVal as string, rhsVal as string);
    }

    if (cmp !== 0) {
      return direction === OrderingDirection.Ascending ? cmp : -cmp;
    }
  }

  const createdCmp = strcmp(lhs.created_at, rhs.created_at);
  if (createdCmp !== 0) return createdCmp;

  return lhs.id - rhs.id;
}
