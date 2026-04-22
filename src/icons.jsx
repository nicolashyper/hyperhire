// Minimal line-icon set — 16px stroke icons, consistent 1.5 weight

const makeIcon = (paths, size = 16) => ({ className = "", style = {}, size: s = size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 16 16"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style} aria-hidden="true">
    {paths}
  </svg>
);

const IconBriefcase = makeIcon(<>
  <rect x="2" y="5" width="12" height="8" rx="1.5" />
  <path d="M6 5V3.5A1 1 0 0 1 7 2.5h2a1 1 0 0 1 1 1V5" />
  <path d="M2 8.5h12" />
</>);
const IconList = makeIcon(<>
  <path d="M5 4h9M5 8h9M5 12h9" />
  <circle cx="2.5" cy="4" r="0.8" fill="currentColor" stroke="none" />
  <circle cx="2.5" cy="8" r="0.8" fill="currentColor" stroke="none" />
  <circle cx="2.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
</>);
const IconUser = makeIcon(<>
  <circle cx="8" cy="5.5" r="2.5" />
  <path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
</>);
const IconPlus = makeIcon(<>
  <path d="M8 3v10M3 8h10" />
</>);
const IconSearch = makeIcon(<>
  <circle cx="7" cy="7" r="4.5" />
  <path d="M10.5 10.5 13.5 13.5" />
</>);
const IconArrowRight = makeIcon(<>
  <path d="M3 8h10M9 4l4 4-4 4" />
</>);
const IconArrowLeft = makeIcon(<>
  <path d="M13 8H3M7 4 3 8l4 4" />
</>);
const IconCheck = makeIcon(<>
  <path d="m3 8.5 3 3 7-7" />
</>);
const IconX = makeIcon(<>
  <path d="m4 4 8 8M12 4l-8 8" />
</>);
const IconExternal = makeIcon(<>
  <path d="M6 3H3v10h10v-3" />
  <path d="M9 3h4v4" />
  <path d="m8 8 5-5" />
</>);
const IconMapPin = makeIcon(<>
  <path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14Z" />
  <circle cx="8" cy="6.5" r="1.5" />
</>);
const IconClock = makeIcon(<>
  <circle cx="8" cy="8" r="5.5" />
  <path d="M8 5v3.5L10 10" />
</>);
const IconUsers = makeIcon(<>
  <circle cx="6" cy="5.5" r="2" />
  <path d="M2 12.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" />
  <path d="M10.5 4.5a2 2 0 0 1 0 4M14 12.5c0-1.5-1-2.7-2.5-3.2" />
</>);
const IconDollar = makeIcon(<>
  <path d="M8 2v12" />
  <path d="M11 5H6.5a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3H5" />
</>);
const IconUpload = makeIcon(<>
  <path d="M8 11V3M5 6l3-3 3 3" />
  <path d="M3 11v1.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V11" />
</>);
const IconBell = makeIcon(<>
  <path d="M3.5 12h9L11 9.5V7a3 3 0 0 0-6 0v2.5L3.5 12Z" />
  <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
</>);
const IconSettings = makeIcon(<>
  <circle cx="8" cy="8" r="2" />
  <path d="M13 8a5 5 0 0 0-.1-1l1.2-1-1-1.7-1.5.5a5 5 0 0 0-1.7-1L9.5 2h-3l-.4 1.7a5 5 0 0 0-1.7 1l-1.5-.5-1 1.7 1.2 1a5 5 0 0 0 0 2l-1.2 1 1 1.7 1.5-.5a5 5 0 0 0 1.7 1l.4 1.9h3l.4-1.7a5 5 0 0 0 1.7-1l1.5.5 1-1.7-1.2-1c.1-.3.1-.7.1-1Z" />
</>);
const IconChevronDown = makeIcon(<>
  <path d="m4 6 4 4 4-4" />
</>);
const IconFilter = makeIcon(<>
  <path d="M2 4h12l-4.5 5v4L6.5 15v-6L2 4Z" />
</>);
const IconSparkle = makeIcon(<>
  <path d="M8 2v3M8 11v3M2 8h3M11 8h3" />
  <path d="m4 4 2 2M10 10l2 2M12 4l-2 2M6 10l-2 2" />
</>);

window.HH_ICONS = {
  IconBriefcase, IconList, IconUser, IconPlus, IconSearch, IconArrowRight, IconArrowLeft,
  IconCheck, IconX, IconExternal, IconMapPin, IconClock, IconUsers, IconDollar, IconUpload,
  IconBell, IconSettings, IconChevronDown, IconFilter, IconSparkle
};
