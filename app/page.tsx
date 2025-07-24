'use client';

import dynamic from 'next/dynamic';
import sketch from './sketch';
import { useEffect, useRef } from 'react';
// Dynamically load the P5 wrapper (client-only)
const ReactP5Wrapper = dynamic(() => import('react-p5-wrapper').then(mod => mod.ReactP5Wrapper), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page() {
    //create empty container reference to hold the P5 canvas for mobile usage
    const containerRef = useRef(null);
    // Prevent touch events from scrolling the page
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const prevent = (e) => {
            e.preventDefault();
        };
        // Add touchstart event listener to prevent scrolling
        container.addEventListener('touchstart', prevent, { passive: false });

        return () => {
            container.removeEventListener('touchstart', prevent);

        };

  }, []);

  /**Font Colour: #231f20
   * Background Colour: #ffffff
   * Accent font colour: #2e6da8
   * Accent background colour: #f3f3f3 
   */

    return (
        <div id="mainBody" className="h-dvh w-full overflow-hidden relative">
            <div className="font-firmaAlt text-title font-black flex h-1/10 bg-[#f3f3f3] text-[#231f20] items-center justify-center">Nathan Kaffes.</div>
            <div ref={containerRef} className="touch-none overflow-hidden h-screen relative">
                <ReactP5Wrapper sketch={sketch}/>
            </div>
        </div>
    );
}
