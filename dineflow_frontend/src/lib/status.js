// Maps backend status strings → label + Tailwind class fragments.
// (Spec colours: green / yellow / blue / red, rendered in muted hospitality tones.)

export const STATUS = {
  available: {
    label:    'Available',
    accent:   'moss',
    cardBg:   'bg-moss-50',
    cardEdge: 'border-moss-100',
    pillBg:   'bg-moss-100',
    pillText: 'text-moss-700',
    dot:      'bg-moss-500',
    barTop:   'bg-moss-500',
  },
  occupied: {
    label:    'Occupied',
    accent:   'honey',
    cardBg:   'bg-honey-50',
    cardEdge: 'border-honey-100',
    pillBg:   'bg-honey-100',
    pillText: 'text-honey-700',
    dot:      'bg-honey-500',
    barTop:   'bg-honey-500',
  },
  ordered: {
    label:    'Ordered',
    accent:   'slateb',
    cardBg:   'bg-slateb-50',
    cardEdge: 'border-slateb-100',
    pillBg:   'bg-slateb-100',
    pillText: 'text-slateb-700',
    dot:      'bg-slateb-500',
    barTop:   'bg-slateb-500',
  },
  billed: {
    label:    'Billed',
    accent:   'clay',
    cardBg:   'bg-clay-50',
    cardEdge: 'border-clay-100',
    pillBg:   'bg-clay-100',
    pillText: 'text-clay-700',
    dot:      'bg-clay-500',
    barTop:   'bg-clay-500',
  },
}

export const statusOf = (s) => STATUS[s] || STATUS.available
