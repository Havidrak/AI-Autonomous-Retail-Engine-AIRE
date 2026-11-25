export function StatusDot({ status }) {
  return (
    <span className={`status-dot ${status}`} aria-label={status}>
      {status === 'success' ? <IconCheck /> : <IconAlert />}
    </span>
  )
}

export function NavIcon({ type }) {
  switch (type) {
    case 'grid':
      return <IconGrid />
    case 'database':
      return <IconDatabase />
    case 'trend':
      return <IconTrend />
    case 'box':
      return <IconBox />
    case 'users':
      return <IconUsers />
    case 'gear':
      return <IconGear />
    case 'duplicate':
      return <IconDuplicate />
    case 'fill':
      return <IconFill />
    case 'calendar':
      return <IconCalendar />
    case 'spark':
      return <IconSparkSmall />
    case 'target':
      return <IconTarget />
    default:
      return null
  }
}

export function DashboardGlyph({ type }) {
  switch (type) {
    case 'money':
      return <IconMoney />
    case 'trend':
      return <IconTrend />
    case 'health':
      return <IconHealth />
    case 'target':
      return <IconTarget />
    case 'warning':
      return <IconAlert />
    case 'check':
      return <IconCheck />
    case 'box':
      return <IconBox />
    case 'users':
      return <IconUsers />
    case 'spark':
      return <IconSparkSmall />
    case 'sparkles':
      return <IconSparkles />
    case 'arrow':
      return <IconChevronRight />
    case 'schedule':
      return <IconCalendar />
    case 'more':
      return <IconMore />
    default:
      return <IconGrid />
  }
}

export function IconBrandMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2.5" fill="currentColor" opacity="0.18" />
      <path
        d="M8 15V11M12 15V8M16 15V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 18.5h11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconProjectMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M10 36 24 12l8 14 6-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 36 21.5 30 28 36l6-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="37" cy="14" r="4.7" fill="currentColor" />
    </svg>
  )
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M15.5 15.5 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4a4 4 0 0 1 4 4v2.5c0 1 .37 1.96 1.04 2.7l1.16 1.3H5.8l1.16-1.3A4 4 0 0 0 8 10.5V8a4 4 0 0 1 4-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 18a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconApps() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h4v6H7zM13 5h4l3 6h-7zM7 13h4v6H4zM13 13h7v6h-7z" fill="currentColor" />
    </svg>
  )
}

export function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 18.5h8a4 4 0 1 0-.82-7.91A5.5 5.5 0 0 0 4 12.5a4 4 0 0 0 3.5 6Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 16V8m0 0-3 3m3-3 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h14M8 12h8M10.5 17h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v9m0 0-3.5-3.5M12 14l3.5-3.5M6 18.5h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconSparkles() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m7 5 1.2 3.3L11.5 10 8.2 11.7 7 15l-1.2-3.3L2.5 10l3.3-1.7L7 5Z"
        fill="currentColor"
      />
      <path
        d="m17 3 .8 2.2L20 6l-2.2.8L17 9l-.8-2.2L14 6l2.2-.8L17 3Z"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  )
}

export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m7 12.5 3 3 7-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 7.5v5m0 3h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m10 7 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m14 7-5 5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="currentColor" />
    </svg>
  )
}

export function IconDatabase() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse
        cx="12"
        cy="6.5"
        rx="6.5"
        ry="2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 6.5v7c0 1.55 2.91 2.8 6.5 2.8s6.5-1.25 6.5-2.8v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 10c0 1.55 2.91 2.8 6.5 2.8s6.5-1.25 6.5-2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function IconTrend() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 16 5-5 3.5 3.5L19 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 9h4v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconBox() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 7h12v11H6z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 7h16M9 11h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 18.5a5 5 0 0 1 9 0M13 18a4.25 4.25 0 0 1 7.5-1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconGear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3 1.2 2.3 2.6.4.8 2.5 2.2 1.5-.8 2.5.8 2.5-2.2 1.5-.8 2.5-2.6.4L12 21l-1.2-2.3-2.6-.4-.8-2.5-2.2-1.5.8-2.5-.8-2.5 2.2-1.5.8-2.5 2.6-.4L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function IconDuplicate() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="8"
        y="5"
        width="10"
        height="13"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 9H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconFill() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h12v14H6z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 15.5 11 12l2 2 3-3 2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4.5"
        y="6"
        width="15"
        height="13"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 4v4M16 4v4M4.5 10h15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 6a6 6 0 1 1-4.24 10.24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v3.5l2.5 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.3 6.2 8.8 7.7M5.8 10H8M7.3 13.8l1.5-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h14M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7m-7.5 0 .7 11a1.8 1.8 0 0 0 1.8 1.7h3.2a1.8 1.8 0 0 0 1.8-1.7l.7-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v5M14 11v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconSparkSmall() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m8 5 1.1 3.1L12 9.3l-2.9 1.2L8 13.6l-1.1-3.1L4 9.3l2.9-1.2L8 5Z"
        fill="currentColor"
      />
      <path
        d="m16.5 10 1 2.2L20 13l-2.5.8-1 2.2-1-2.2L13 13l2.5-.8 1-2.2Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  )
}

export function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="6.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconFilterMini() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6h12l-4.5 5.2v5.3l-3 1v-6.3Z" fill="currentColor" />
    </svg>
  )
}

export function IconRocket() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.9 4.1c2.5.3 4.7 2.5 5 5l-4.1 4.1-5-5 4.1-4.1Zm-5.2 5.6 4.6 4.6-4.2 1.2-1.9 1.9a.9.9 0 0 1-1.3 0l-.5-.5a.9.9 0 0 1 0-1.3l1.9-1.9 1.4-4Zm-1.5 7.1c.9 0 1.8.3 2.5 1-.7.3-1.4.8-2 1.4-.6.6-1.1 1.3-1.4 2-.7-.7-1-1.6-1-2.5 0-1 .7-1.9 1.9-1.9Z"
        fill="currentColor"
      />
      <circle cx="16.1" cy="7.9" r="1.25" fill="#f5f9ff" />
      <path
        d="m12.1 12.1-1.8 1.8"
        fill="none"
        stroke="#f5f9ff"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconMail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m5.5 7.5 6.5 5 6.5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconGoogle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 12.2c0-.7-.06-1.37-.18-2H12v3.78h5.05a4.33 4.33 0 0 1-1.88 2.84v2.36h3.05c1.79-1.65 2.78-4.07 2.78-7Z"
        fill="#4285F4"
      />
      <path
        d="M12 21c2.52 0 4.64-.84 6.18-2.28l-3.05-2.36c-.84.56-1.92.9-3.13.9-2.41 0-4.46-1.63-5.19-3.82H3.66v2.44A9.33 9.33 0 0 0 12 21Z"
        fill="#34A853"
      />
      <path
        d="M6.81 13.44A5.6 5.6 0 0 1 6.52 12c0-.5.1-.99.29-1.44V8.12H3.66A9.33 9.33 0 0 0 2.7 12c0 1.5.36 2.9.96 4.12l3.15-2.68Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.74c1.37 0 2.6.47 3.57 1.4l2.68-2.68C16.63 3.95 14.52 3 12 3a9.33 9.33 0 0 0-8.34 5.12l3.15 2.44C7.54 8.37 9.59 6.74 12 6.74Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19a6.5 6.5 0 0 1 13 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconLock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="6"
        y="11"
        width="12"
        height="9"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 11V8.5a3.5 3.5 0 1 1 7 0V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconArrowSwap() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3-3m-3 3 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconSignOut() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 6H6v12h4M14 8l4 4-4 4M18 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconBadge() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 4 2 .8 2.1-.2 1.4 1.6 2 .7.4 2.1 1.4 1.6-.8 2 .2 2.1-1.6 1.4-.7 2.1-2.1.4-1.6 1.4-2-.8-2 .8-1.6-1.4-2.1-.4-.7-2.1-1.6-1.4.2-2.1-.8-2 1.4-1.6.4-2.1 2-.7 1.4-1.6 2.1.2L12 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12.1 1.8 1.8 3.8-4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconMoney() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 10h.01M17.5 14h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconHealth() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.2S4.5 15.6 4.5 9.8A4.3 4.3 0 0 1 8.8 5.5c1.5 0 2.6.6 3.2 1.7.6-1.1 1.7-1.7 3.2-1.7a4.3 4.3 0 0 1 4.3 4.3c0 5.8-7.5 10.4-7.5 10.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 12h2l1.1-2.2 1.4 4 1.2-1.8h1.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconMore() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6.5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="17.5" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}
