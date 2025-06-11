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
    //create empty container ref to hold the P5 canvas
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

    return (
        <div ref={containerRef} className="touch-none overflow-hidden h-screen">
            <ReactP5Wrapper sketch={sketch}/>
        </div>
    );
}
