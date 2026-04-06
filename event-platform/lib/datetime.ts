const LOCAL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone)
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )

  return asUtc - date.getTime()
}

export function normalizeDateTimeInput(value: string, timeZone: string): string {
  if (!value) return value

  const match = LOCAL_DATETIME_PATTERN.exec(value)
  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
  }

  try {
    const [, year, month, day, hour, minute, second = '00'] = match
    const utcGuess = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    )

    const offset = getTimeZoneOffsetMs(utcGuess, timeZone)
    const zonedDate = new Date(utcGuess.getTime() - offset)
    const adjustedOffset = getTimeZoneOffsetMs(zonedDate, timeZone)
    const normalizedDate =
      adjustedOffset === offset ? zonedDate : new Date(utcGuess.getTime() - adjustedOffset)

    return normalizedDate.toISOString()
  } catch {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
  }
}

export function formatDateTimeInput(value: string, timeZone: string): string {
  if (!value) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  try {
    const parts = getTimeZoneParts(date, timeZone)
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
  } catch {
    return value
  }
}
