"use client";

// This page is no longer needed as the creation flow is now handled by a modal.
// You can remove this file. We are keeping it to avoid breaking changes during deployment,
// but it is not used in the app navigation flow.
import { redirect } from 'next/navigation';

export default function CreatePage() {
  redirect('/posts');
}
