import type { ImageSourcePropType } from 'react-native'
import type { EventCategory, EventStatus, SkillLevel } from './types'

export function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function getRegistrationPercentage(current: number, max: number): number {
  return Math.round((current / max) * 100)
}

export function getSpotsLeft(current: number, max: number): number {
  return max - current
}

export function isEventFull(current: number, max: number): boolean {
  return current >= max
}

export function isEventSoon(dateStr: string): boolean {
  const diff = new Date(dateStr).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
}

// Theme colors — Sportify-inspired black & white
export const THEME = {
  orange: '#000000',                    // primary accent → pure black
  orangeDark: '#1A1A1A',
  orangeBg: 'rgba(0,0,0,0.06)',
  orangeLight: 'rgba(0,0,0,0.05)',
  bg: '#F5F5F5',                        // light gray page bg
  card: '#FFFFFF',                      // white cards
  text: '#0A0A0A',                      // near-black text
  textSecondary: '#4A4A4A',
  textTertiary: '#9A9A9A',
  border: '#E8E8E8',
  green: '#000000',
  greenBg: 'rgba(0,0,0,0.06)',
  red: '#0A0A0A',                       // black replaces red (live badge)
  redBg: 'rgba(0,0,0,0.05)',
  black: '#0A0A0A',
}

const UNS = 'https://images.unsplash.com/photo'
const IMG = (id: string): ImageSourcePropType => ({ uri: `${UNS}-${id}?w=800&h=400&fit=crop&auto=format&q=80` })

// Event COVER images. Kept deliberately separate from the BY SPORT browse images
// (assets/sports/*.png) — covers use remote photos so the browse art is used nowhere else.
export const categoryMeta: Record<EventCategory, { label: string; emoji: string; color: string; bg: string; image: ImageSourcePropType }> = {
  cricket:      { label: 'Cricket',      emoji: '🏏', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1540747913346-19e32dc3e97e') },
  football:     { label: 'Football',     emoji: '⚽', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1574629810360-7efbbe195018') },
  basketball:   { label: 'Basketball',   emoji: '🏀', color: '#0A0A0A', bg: '#F2F2F2', image: require('../assets/sports/basketball_cover.png') },
  badminton:    { label: 'Badminton',    emoji: '🏸', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1521537634581-0dced2fee2ef') },
  tennis:       { label: 'Tennis',       emoji: '🎾', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1554284126-aa88f22d8b74') },
  volleyball:   { label: 'Volleyball',   emoji: '🏐', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1612872087720-bb876e2e67d1') },
  kabaddi:      { label: 'Kabaddi',      emoji: '🤼', color: '#0A0A0A', bg: '#F2F2F2', image: require('../assets/sports/kabaddi_cover.png') },
  table_tennis: { label: 'Table Tennis', emoji: '🏓', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1611251135345-18c56206b863') },
  swimming:     { label: 'Swimming',     emoji: '🏊', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1530549387789-4c8f7e5b79d7') },
  athletics:    { label: 'Athletics',    emoji: '🏃', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1552674605-db5fec9a2a54') },
  esports:      { label: 'Esports',      emoji: '🎮', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1542751371-adc38448a05e') },
  chess:        { label: 'Chess',        emoji: '♟️', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1529699211952-734e80c4d42b') },
  pickleball:   { label: 'Pickleball',   emoji: '🏓', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1554284126-aa88f22d8b74') },
  boxing:       { label: 'Boxing',       emoji: '🥊', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1547941126-3d5322b218b0') },
  corporate:    { label: 'Corporate',    emoji: '🏢', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1552581234-26160f608093') },
  other:        { label: 'Other',        emoji: '🎯', color: '#0A0A0A', bg: '#F2F2F2', image: IMG('1517649763962-0c623066013b') },
}

export const statusMeta: Record<EventStatus, { label: string; bg: string; text: string }> = {
  upcoming:  { label: 'Upcoming',        bg: '#F0F0F0', text: '#6B7280' },
  live:      { label: '● Live',          bg: '#000000', text: '#FFFFFF' },
  filling:   { label: '🔥 Filling Fast', bg: '#E8E8E8', text: '#0A0A0A' },
  sold_out:  { label: 'Sold Out',        bg: '#F5F5F5', text: '#9A9A9A' },
  completed: { label: 'Completed',       bg: '#F0F0F0', text: '#4A4A4A' },
  cancelled: { label: 'Cancelled',       bg: '#F0F0F0', text: '#9A9A9A' },
}

export const skillMeta: Record<SkillLevel, { label: string; color: string }> = {
  all:          { label: 'All Levels',   color: '#6B7280' },
  beginner:     { label: 'Beginner',     color: '#6B7280' },
  intermediate: { label: 'Intermediate', color: '#374151' },
  advanced:     { label: 'Advanced',     color: '#111827' },
  pro:          { label: 'Pro',          color: '#F97316' },
}
