export interface ResourceLink {
  text: string;
  icon: string;
  url: string;
}

export const resourcesLinks: ResourceLink[] = [
  {
    text: 'Watch demo',
    icon: 'ri-film-line',
    url: 'https://youtu.be/5KRq9uA8qn8',
  },
  {
    text: 'Documentation',
    icon: 'ri-book-open-line',
    url: 'https://docs.getsphere.dev',
  },
  {
    text: 'Changelog',
    icon: 'ri-megaphone-line',
    url: 'https://github.com/liscioapps/getsphere',
  },
  {
    text: 'Discord community',
    icon: 'ri-discord-fill',
    url: 'https://getsphere.dev/discord',
  },
];
