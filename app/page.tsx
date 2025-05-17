'use client';

import dynamic from 'next/dynamic';
import Ball from './ball';

// Dynamically load the P5 wrapper (client-only)
const ReactP5Wrapper = dynamic(() => import('react-p5-wrapper').then(mod => mod.ReactP5Wrapper), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

// Your P5 sketch
const sketch = (p5: any) => {
    const activeBalls: Ball[] = [];
    const gravity = 0.2;
    let trajectory: number[] = [0, 0];
    p5.setup = () => {
        p5.createCanvas(400, 400);
    };

    p5.draw = () => {
        // Update and display all balls
        p5.background(240);
        updateBalls(p5, activeBalls);
    };

    p5.mousePressed = () => {	
        trajectory[0] = p5.mouseX;
        trajectory[1] = p5.mouseY;
        p5.line(trajectory[0], trajectory[1], p5.mouseX, p5.mouseY);
    }

    p5.mouseReleased = () => {
        let ball = new Ball(trajectory[0], trajectory[1], 20);
        let vx = (p5.mouseX - trajectory[0]) * -0.1;
        let vy = (p5.mouseY - trajectory[1]) * -0.1;
        ball.setVelocity(vx, vy);
        activeBalls.push(ball);
        trajectory[0] = 0;
        trajectory[1] = 0;
    }

    function updateBalls(p5: any, balls: Ball[]) {
        applyGravity(balls);
        for (let i = 0; i < balls.length; i++) {
            wallCollision(balls[i], p5);
        }
        for (let i = 0; i < balls.length; i++) {
            balls[i].move();
            balls[i].display(p5);
        }
    }

    function applyGravity(balls: Ball[]) {
        for (let i = 0; i < balls.length; i++) {
            balls[i].setVelocity(0, gravity);
        }
    }

    function wallCollision(ball: Ball, p5: any) {
        if (ball.y + ball.r >= p5.height) {
            ball.y = p5.height - ball.r;
            ball.vy *= -1 + gravity;
        }
        if (ball.y - ball.r <= 0) {
            ball.y = ball.r;
            ball.vy *= -1 + gravity;
        }
        if (ball.x + ball.r >= p5.width) {
            ball.x = p5.width - ball.r;
            ball.vx *= -1 + gravity;
        }
        if (ball.x - ball.r <= 0) {
            ball.x = ball.r;
            ball.vx *= -1 + gravity;
        }
    }
};

export default function Page() {
  return (
    <div>
      <h1>P5.js in Next.js</h1>
      <ReactP5Wrapper sketch={sketch} />
    </div>
  );
}
