import BottomNav from './BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
