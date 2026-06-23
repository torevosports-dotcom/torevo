import * as Notifications from 'expo-notifications'

// Show reminders even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false } as any),
})

export async function ensureNotifyPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync()
  if (cur.granted || cur.status === 'granted') return true
  const req = await Notifications.requestPermissionsAsync()
  return req.granted || req.status === 'granted'
}

// Convert "6:00 PM" / "18:00" / "6 PM" into "HH:MM"; returns null if unparseable.
function to24h(time?: string): string | null {
  if (!time) return null
  const m = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const min = m[2] ? parseInt(m[2], 10) : 0
  const ap = m[3]?.toLowerCase()
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function eventStart(ev: any): Date | null {
  if (ev?.starts_at) {
    const d = new Date(ev.starts_at)
    if (!isNaN(d.getTime())) return d
  }
  if (ev?.date) {
    const t = to24h(ev.time) ?? '09:00'
    const d = new Date(`${ev.date}T${t}:00`)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

const ids = (eventId: string) => [`evt-${eventId}-1d`, `evt-${eventId}-1h`]

export async function isReminderSet(eventId: string): Promise<boolean> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync()
    return all.some((n) => n.identifier?.startsWith(`evt-${eventId}`))
  } catch {
    return false
  }
}

export async function cancelReminder(eventId: string): Promise<void> {
  for (const id of ids(eventId)) {
    try { await Notifications.cancelScheduledNotificationAsync(id) } catch {}
  }
}

// Schedules "1 day before" + "1 hour before" local reminders for an event.
// Returns 'set' | 'past' (event too soon / no future trigger) | 'denied'.
export async function setReminder(ev: any): Promise<'set' | 'past' | 'denied'> {
  if (!(await ensureNotifyPermission())) return 'denied'
  await cancelReminder(ev.id)
  const start = eventStart(ev)
  if (!start) return 'past'
  const now = Date.now()
  const plan = [
    { id: `evt-${ev.id}-1d`, at: start.getTime() - 24 * 3600 * 1000, body: `${ev.title} is tomorrow — get ready!` },
    { id: `evt-${ev.id}-1h`, at: start.getTime() - 60 * 60 * 1000, body: `${ev.title} starts in 1 hour.` },
  ].filter((p) => p.at > now + 5000)
  if (!plan.length) return 'past'
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: 'Torevo reminder', body: p.body },
      trigger: { type: 'date', date: new Date(p.at) } as any,
    })
  }
  return 'set'
}
