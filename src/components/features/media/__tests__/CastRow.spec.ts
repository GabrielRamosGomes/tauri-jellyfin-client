import type { BaseItemDto, BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemDetail, getLibraryImageUrl, getPersonImageUrl } from '@/api/jellyfin/library';
import CastRow from '@/components/features/media/CastRow.vue';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { deferred } from '@/test/utils';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models';
import { fireEvent, render, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

vi.mock('@/api/jellyfin/library');

const andrew: BaseItemPerson = {
	Id: 'p-andrew',
	Name: 'Andrew Garfield',
	Role: 'Eduardo Saverin',
	Type: PersonKind.Actor,
	PrimaryImageTag: 'stale',
};

function renderCast(people: BaseItemPerson[] = [andrew]) {
	const router = createRouter({
		history: createMemoryHistory(),
		routes: [{ path: '/person/:id', name: 'person', component: { render: () => null } }],
	});
	render(CastRow, { props: { people }, global: { plugins: [router] } });
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
	it('lists actors and guest stars, not the crew', () => {
		renderCast([
			andrew,
			{ Id: 'p-guest', Name: 'Guest Star', Type: PersonKind.GuestStar },
			{ Id: 'p-fincher', Name: 'David Fincher', Type: PersonKind.Director },
		]);

		expect(screen.getByText('Andrew Garfield')).toBeInTheDocument();
		expect(screen.getByText('Guest Star')).toBeInTheDocument();
		expect(screen.queryByText('David Fincher')).not.toBeInTheDocument();
	});

	it('swaps a photo that fails to load for initials, then for the refreshed photo', async () => {
		const refreshed = deferred<BaseItemDto>();
		vi.mocked(getItemDetail).mockReturnValue(refreshed.promise);
		renderCast();

		await fireEvent.error(screen.getByRole('img', { name: 'Andrew Garfield' }));

		expect(screen.queryByRole('img', { name: 'Andrew Garfield' })).not.toBeInTheDocument();
		expect(screen.getByText('AG')).toBeInTheDocument();

		refreshed.resolve(makeItem({ Id: 'p-andrew', ImageTags: { Primary: 'fresh' } }));
		const photo = await screen.findByRole('img', { name: 'Andrew Garfield' });
		expect(photo).toHaveAttribute('src', 'p-andrew.jpg?tag=fresh');
	});

	it('keeps the initials when the photo cannot be recovered', async () => {
		vi.mocked(getItemDetail).mockResolvedValue(makeItem({ Id: 'p-andrew', ImageTags: {} }));
		renderCast();

		await fireEvent.error(screen.getByRole('img', { name: 'Andrew Garfield' }));

		expect(await screen.findByText('AG')).toBeInTheDocument();
		expect(screen.queryByRole('img', { name: 'Andrew Garfield' })).not.toBeInTheDocument();
	});
});
