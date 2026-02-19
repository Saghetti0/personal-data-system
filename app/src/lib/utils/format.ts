import type { When } from '$shared/types';

/** Format a When as a short time string, e.g. "2:17 PM". */
export function formatTime(when: When): string {
	return new Date(when.timestamp).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: when.timezone,
	});
}

/** Format a When as a short date string, e.g. "Feb 18". */
export function formatDate(when: When): string {
	return new Date(when.timestamp).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		timeZone: when.timezone,
	});
}

/** Format a When as a full date+time string, e.g. "Feb 18, 2:17 PM". */
export function formatDateTime(when: When): string {
	return new Date(when.timestamp).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: when.timezone,
	});
}

/** Count whitespace-separated words in a string. */
export function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}
