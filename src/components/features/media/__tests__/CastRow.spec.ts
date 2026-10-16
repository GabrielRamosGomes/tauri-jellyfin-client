import type { BaseItemDto, BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemDetail, getLibraryImageUrl, getPersonImageUrl } from '@/api/jellyfin/library';
import CastRow from '@/components/features/media/CastRow.vue';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import { deferred } from '@/test/utils';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models';
import { fireEvent, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const andrew: BaseItemPerson = {
	Id: 'p-andrew',
	Name: 'Andrew Garfield',
	Role: 'Eduardo Saverin',
	Type: PersonKind.Actor,
	PrimaryImageTag: 'stale',
};

function renderCast(people: BaseItemPerson[] = [andrew]) {
	return renderAt(CastRow, '/item/movie-1', { props: { people } });
}

beforeEach(() => {
	signOut();
	signIn();
	vi.mocked(getPersonImageUrl).mockImplementation(
		(_api, person) => `${person.Id}.jpg?tag=${person.PrimaryImageTag}`,
	);
	vi.mocked(getLibraryImageUrl).mockImplementation(
		(_api, item) => `${item.Id}.jpg?tag=${item.ImageTags?.Primary}`,
	);
});

describe('CastRow', () => {
	it('lists actors and guest stars, not the crew', async () => {
		await renderCast([
			andrew,
			{ Id: 'p-guest', Name: 'Guest Star', Type: PersonKind.GuestStar },
			{ Id: 'p-fincher', Name: 'David Fincher', Type: PersonKind.Director },
		]);

		expect(screen.getByText('Andrew Garfield')).toBeInTheDocument();
		expect(screen.getByText('Guest Star')).toBeInTheDocument();
		expect(screen.queryByText('David Fincher')).not.toBeInTheDocument();
	});

	it('links each cast member to their own page', async () => {
		await renderCast();

		expect(screen.getByRole('link', { name: /Andrew Garfield/ })).toHaveAttribute(
			'href',
			'/person/p-andrew',
		);
	});

	it('swaps a photo that fails to load for initials, then for the refreshed photo', async () => {
		const refreshed = deferred<BaseItemDto>();
		vi.mocked(getItemDetail).mockReturnValue(refreshed.promise);
		await renderCast();

		await fireEvent.error(screen.getByRole('img', { name: 'Andrew Garfield' }));

		expect(screen.queryByRole('img', { name: 'Andrew Garfield' })).not.toBeInTheDocument();
		expect(screen.getByText('AG')).toBeInTheDocument();

		refreshed.resolve(makeItem({ Id: 'p-andrew', ImageTags: { Primary: 'fresh' } }));
		const photo = await screen.findByRole('img', { name: 'Andrew Garfield' });
		expect(photo).toHaveAttribute('src', 'p-andrew.jpg?tag=fresh');
	});

	it('keeps the initials when the photo cannot be recovered', async () => {
		vi.mocked(getItemDetail).mockResolvedValue(makeItem({ Id: 'p-andrew', ImageTags: {} }));
		await renderCast();

		await fireEvent.error(screen.getByRole('img', { name: 'Andrew Garfield' }));

		expect(await screen.findByText('AG')).toBeInTheDocument();
		expect(screen.queryByRole('img', { name: 'Andrew Garfield' })).not.toBeInTheDocument();
	});
});
