import { Nav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { Crossing } from '@/components/landing/crossing';
import { Tools } from '@/components/landing/tools';
import { UssdSection } from '@/components/landing/ussd-section';
import { EssaysSection } from '@/components/landing/essays-section';
import { CueRadar } from '@/components/landing/cue-radar';
import { Proof } from '@/components/landing/proof';
import { Footer } from '@/components/landing/footer';
import { SmoothScroll } from '@/components/motion/smooth-scroll';

/**
 * Landing page, eight chapters (DESIGN.md 7.1):
 * hero (light) > the Crossing (dark) > tools (paper) > phone (dark) > essays (light) > safety (wash) > proof (paper) > footer (dark)
 */
export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <main id="main">
        <Hero />
        <Crossing />
        <Tools />
        <UssdSection />
        <EssaysSection />
        <CueRadar />
        <Proof />
      </main>
      <Footer />
    </>
  );
}
