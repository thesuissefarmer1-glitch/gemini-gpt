import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to the main posts feed. The authentication check will be handled on that page.
  redirect('/posts');
}
