const iso = seconds => new Date(seconds * 1000).toISOString()

// The checkin id doubles as the event id (inserting the same checkin twice is rejected by the calendar)
export function toEvent(checkin, minutes) {
  const { venue } = checkin
  return {
    id: checkin.id,
    summary: `I was at ${venue.name}`,
    location: [venue.name, ...(venue.location?.formattedAddress ?? [])].join(', '),
    description: [checkin.shout, `https://foursquare.com/v/${venue.id}`].filter(Boolean).join('\n'),
    start: { dateTime: iso(checkin.createdAt) },
    end: { dateTime: iso(checkin.createdAt + minutes * 60) }
  }
}
