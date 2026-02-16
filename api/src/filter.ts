// --- Filter system ---

/*
 * TODO: Things to implement in the future (when the filter system is refactored+optimized)
 * - Tag sub-components (ex: #foo matches #foo/bar)
 * - More types of natural text matching
 * - More complex geo queries (point within poly)
 * - Inspectability for more things that have dubious utility? (ex: attachment metadata)
 */

import { getPreciseDistance } from "geolib";
import { Note, Filter, FilterType, TextMatchRule } from "./types";

export function noteMatchesFilter(note: Note, filter: Filter): boolean {
  switch (filter.op) {
    case FilterType.Anything:
      return true;

    case FilterType.And:
      return filter.d.every(f => noteMatchesFilter(note, f));

    case FilterType.Or:
      return filter.d.some(f => noteMatchesFilter(note, f));

    case FilterType.Not:
      return !noteMatchesFilter(note, filter.d);

    case FilterType.HasFields:
      return filter.d.every(field => note.fields[field] !== undefined);

    case FilterType.TagsInclude: {
      const { tags } = note.fields;
      if (tags === undefined) return false;
      return filter.d.every(tagId => tags.includes(tagId));
    }

    case FilterType.TextMatch: {
      const { field, mode, text } = filter.d;
      const value = note.fields[field];
      if (value === undefined) return false;
      const haystack = value.toLowerCase();
      const needle = text.toLowerCase();
      switch (mode) {
        case TextMatchRule.Left:     return haystack.startsWith(needle);
        case TextMatchRule.Contains: return haystack.includes(needle);
      }
    }

    case FilterType.TimeRange: {
      const { when } = note.fields;
      if (when === undefined) return false;
      const ts = new Date(when.timestamp).getTime();
      const { before, after } = filter.d;
      if (before !== undefined && ts >= new Date(before).getTime()) return false;
      if (after  !== undefined && ts <= new Date(after).getTime())  return false;
      return true;
    }

    case FilterType.LocationNear: {
      const { location } = note.fields;
      if (location === undefined) return false;
      const { loc, km } = filter.d;
      const meters = getPreciseDistance(
        { latitude: location.lat, longitude: location.lon },
        { latitude: loc.lat,      longitude: loc.lon      },
      );
      return meters <= km * 1000;
    }
  }
}

export function filterNotes(notes: Note[], filter: Filter): Note[] {
  return notes.filter(note => noteMatchesFilter(note, filter));
}
