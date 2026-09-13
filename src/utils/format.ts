// Jellyfin durations are in "ticks" (100-nanosecond units): 600,000,000 per minute.
export const TICKS_PER_MINUTE = 600_000_000;

export function ticksToMinutes(ticks?: number | null): number | undefined {
	return ticks ? Math.round(ticks / TICKS_PER_MINUTE) : undefined;
}

export function formatDuration(ticks?: number | null): string | undefined {
	const minutes = ticksToMinutes(ticks);
	if (!minutes) return undefined;

	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return hours ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatEndsAt(ticks?: number | null): string | undefined {
	const minutes = ticksToMinutes(ticks);
	if (!minutes) return undefined;

	const finishTime = new Date(Date.now() + minutes * 60_000);
	return finishTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatRating(rating?: number | null): string | undefined {
	return rating == null ? undefined : rating.toFixed(1);
}

export function getInitials(name?: string | null): string {
	if (!name) return '?';

	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
}
