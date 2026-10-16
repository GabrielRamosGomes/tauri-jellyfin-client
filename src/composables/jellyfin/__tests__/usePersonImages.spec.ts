import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemDetail, getLibraryImageUrl, getPersonImageUrl } from '@/api/jellyfin/library';
import { usePersonImages } from '@/composables/jellyfin/usePersonImages';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { deferred } from '@/test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const andrew = { Id: 'p-andrew', Name: 'Andrew Garfield', PrimaryImageTag: 'stale' };
const max = { Id: 'p-max', Name: 'Max Minghella', PrimaryImageTag: 'stale' };

const refreshedPerson = (Id: string, tag?: string) =>
	makeItem({ Id, Type: 'Person', ImageTags: tag ? { Primary: tag } : {} });

beforeEach(() => {
	signOut();
	signIn();
	vi.mocked(getPersonImageUrl).mockImplementation((_api, person) =>
		person.PrimaryImageTag ? `${person.Id}.jpg?tag=${person.PrimaryImageTag}` : undefined,
	);
	vi.mocked(getLibraryImageUrl).mockImplementation(
		(_api, item) => `${item.Id}.jpg?tag=${item.ImageTags?.Primary}`,
	);
});

describe('usePersonImages', () => {
	it("shows the image from the cast member's own tag", () => {
		const { imageUrl } = usePersonImages();

		expect(imageUrl(andrew)).toBe('p-andrew.jpg?tag=stale');
	});

	it('shows no image while you are signed out', () => {
		signOut();

		expect(usePersonImages().imageUrl(andrew)).toBeUndefined();
	});

	describe('when an image fails to load', () => {
		it('requests the person once, which makes Jellyfin refresh it, then shows the new image', async () => {
			vi.mocked(getItemDetail).mockResolvedValue(refreshedPerson('p-andrew', 'fresh'));
			const { imageUrl, onImageError } = usePersonImages();

			await onImageError(andrew);

			expect(getItemDetail).toHaveBeenCalledExactlyOnceWith(
				expect.anything(),
				'user-1',
				'p-andrew',
			);
			expect(imageUrl(andrew)).toBe('p-andrew.jpg?tag=fresh');
		});

		it('hides the broken image while the refresh is in flight, so initials show instead', async () => {
			const response = deferred<BaseItemDto>();
			vi.mocked(getItemDetail).mockReturnValue(response.promise);
			const { imageUrl, onImageError } = usePersonImages();

			const pending = onImageError(andrew);
			expect(imageUrl(andrew)).toBeUndefined();

			response.resolve(refreshedPerson('p-andrew', 'fresh'));
			await pending;
			expect(imageUrl(andrew)).toBe('p-andrew.jpg?tag=fresh');
		});

		it.each([
			['the person still has no image', () => Promise.resolve(refreshedPerson('p-andrew'))],
			[
				'the server kept the same image',
				() => Promise.resolve(refreshedPerson('p-andrew', 'stale')),
			],
			['the request fails', () => Promise.reject(new Error('Server returned 500'))],
		])('falls back to initials when %s', async (_, respond) => {
			vi.mocked(getItemDetail).mockImplementation(respond);
			const { imageUrl, onImageError } = usePersonImages();

			await onImageError(andrew);

			expect(imageUrl(andrew)).toBeUndefined();
		});

		it('gives up instead of retrying again when the refreshed image fails too', async () => {
			vi.mocked(getItemDetail).mockResolvedValue(refreshedPerson('p-andrew', 'fresh'));
			const { imageUrl, onImageError } = usePersonImages();
			await onImageError(andrew);

			await onImageError(andrew);

			expect(imageUrl(andrew)).toBeUndefined();
			expect(getItemDetail).toHaveBeenCalledTimes(1);
		});

		it('recovers each cast member on their own', async () => {
			vi.mocked(getItemDetail).mockResolvedValue(refreshedPerson('p-andrew', 'fresh'));
			const { imageUrl, onImageError } = usePersonImages();

			await onImageError(andrew);

			expect(imageUrl(max)).toBe('p-max.jpg?tag=stale');
		});
	});
});
