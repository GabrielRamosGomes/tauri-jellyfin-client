import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import PersonHeader from '@/components/features/person/PersonHeader.vue';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { openUrl } from '@tauri-apps/plugin-opener';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api/jellyfin/library');
vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }));

const BORN = '1983-08-20T00:00:00.0000000Z';
const bornOn = new Date(BORN).toLocaleDateString();

function renderPerson(overrides: Partial<BaseItemDto> = {}) {
	// Reactive like the view's item, so optimistic favorite changes re-render.
	const person = ref(
		makeItem({ Id: 'p-andrew', Name: 'Andrew Garfield', Type: 'Person', ...overrides }),
	);
	render(PersonHeader, { props: { person: person.value } });
	return person;
}

beforeEach(() => {
	signOut();
	signIn();
});

describe('PersonHeader', () => {
	it.each([
		[
			'birth date and place',
			{ PremiereDate: BORN, ProductionLocations: ['Los Angeles, USA'] },
			`Born ${bornOn} · Los Angeles, USA`,
		],
		['only a birth place', { ProductionLocations: ['Los Angeles, USA'] }, 'Los Angeles, USA'],
		['only a birth date', { PremiereDate: BORN }, `Born ${bornOn}`],
	])('summarises %s', (_, overrides, line) => {
		renderPerson(overrides);

		expect(screen.getByText(line)).toBeInTheDocument();
	});

	it('shows no birth line when nothing is known', () => {
		renderPerson();

		expect(screen.queryByText(/Born/)).not.toBeInTheDocument();
	});

	it('shows initials when there is no photo', () => {
		renderPerson();

		expect(screen.getByText('AG')).toBeInTheDocument();
	});

	it('flips the favorite button as soon as it is clicked', async () => {
		renderPerson({ UserData: { IsFavorite: false } });

		await userEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

		expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
	});

	it('opens external profiles in the system browser', async () => {
		renderPerson({ ExternalUrls: [{ Name: 'IMDb', Url: 'https://www.imdb.com/name/nm1940449' }] });

		await userEvent.click(screen.getByRole('button', { name: 'IMDb' }));

		expect(openUrl).toHaveBeenCalledExactlyOnceWith('https://www.imdb.com/name/nm1940449');
	});
});
