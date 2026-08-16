/**
 * The business's official social profiles — the single source of truth.
 *
 * Consumed by `SiteFooter.astro` (visible links) and the `sameAs` array in the
 * homepage `Organization`/`LocalBusiness` JSON-LD. Keep them fed from here so the
 * two can't drift apart. `icon` is an `astro-icon` name from `@iconify-json/simple-icons`.
 */
export interface SocialProfile {
  name: string;
  url: string;
  icon: string;
}

export const socialProfiles: SocialProfile[] = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/people/Stone-Dragon-Media/61592914063909/",
    icon: "simple-icons:facebook",
  },
  {
    name: "X",
    url: "https://x.com/StoneDragonLLC",
    icon: "simple-icons:x",
  },
  {
    name: "Nextdoor",
    url: "https://nextdoor.com/page/stone-dragon-media-llc-sandusky-oh/",
    // Local `src/icons/nextdoor.svg`, not simple-icons — see that file's comment.
    icon: "nextdoor",
  },
  {
    name: "Yelp",
    url: "https://www.yelp.com/biz/stone-dragon-media-sandusky",
    icon: "simple-icons:yelp",
  },
];

/** Profile URLs only, for the `sameAs` property of schema.org structured data. */
export const socialProfileUrls: string[] = socialProfiles.map((profile) => profile.url);
