import { LoaderCircle } from 'lucide-react';

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
