import { Redirect } from 'expo-router';

// Default route: the root layout's useEffect will handle auth-based redirection.
// This just ensures expo-router has a valid initial route to mount.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
