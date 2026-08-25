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
    name: "Google",
    // Canonical Maps listing URL. The CID is the stable numeric listing id (hex
    // 0x448575372c0a2cd8 in the /maps/place/ URL); share.google and maps.app.goo.gl
    // links are redirects and Google has retired shorteners before, so don't use those.
    url: "https://www.google.com/maps?cid=4937481446304132312",
    icon: "simple-icons:googlemaps",
  },
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
