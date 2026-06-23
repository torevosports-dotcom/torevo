import { Redirect } from 'expo-router'
// The hidden 'host' tab must NOT auto-open Create Event (that modal kept
// reopening on focus). Send it to My Events. Create is a footer action only.
export default function HostTab() {
  return <Redirect href="/manage" />
}
