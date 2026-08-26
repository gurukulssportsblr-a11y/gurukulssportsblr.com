import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Facilities from '@/components/Facilities';
import BookingSystem from '@/components/BookingSystem';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 flex-1">
        <Hero />
        <Facilities />
        <BookingSystem />
      </main>
      <Footer />
    </>
  );
}
