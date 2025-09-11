'use client';

import dynamic from 'next/dynamic';
import sketch from './sketch';
import { useEffect, useRef } from 'react';
// importing icons from FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
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
   * Popup background colour: #e9e9e9
   */

    return (
        <div id="mainBody" className="h-dvh w-full overflow-hidden relative">
            <div className="font-lexend text-title font-semibold flex h-1/10 bg-[#f3f3f3] text-[#231f20] items-center justify-center">Nathan Kaffes.</div>
            {/* float right linkedin and github icons for ease of access */}
            <div className="absolute top-6.5 right-4 z-10 flex h-1/10items-center justify-center">
                <a href="https://github.com/kaffesnath" target="_blank" rel="noopener noreferrer" className="text-3xl text-[#231f20] hover:text-[#2e6da8]">
                    <FontAwesomeIcon icon={faSquareGithub} className="h-8 w-8" />
                </a>
                <a href="https://www.linkedin.com/in/nathan-kaffes/" target="_blank" rel="noopener noreferrer" className="text-3xl text-[#231f20] hover:text-[#2e6da8]">
                    <FontAwesomeIcon icon={faLinkedin} className="h-8 w-8" />
                </a>
            </div>
            {/* P5 canvas container */}
            <div ref={containerRef} className="touch-none overflow-hidden h-screen relative">
                <ReactP5Wrapper sketch={sketch}/>
            </div>
        </div>
    );
}
