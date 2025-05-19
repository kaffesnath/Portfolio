'use client';

import dynamic from 'next/dynamic';
import Ball from './ball';
import Queue from './queue';

// Dynamically load the P5 wrapper (client-only)
const ReactP5Wrapper = dynamic(() => import('react-p5-wrapper').then(mod => mod.ReactP5Wrapper), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

// Your P5 sketch
const sketch = (p5: any) => {
    const balls = new Queue<Ball>(10);
    const gravity = 0.2;
    const COR = 0.2; // Coefficient of restitution (bounciness)
    let trajectory: number[] = [0, 0];
    p5.setup = () => {
        p5.createCanvas(400, 400);
    };

    p5.draw = () => {
        // Update and display all balls
        p5.background(240);
        updateBalls(p5, balls);
    };

    p5.mousePressed = () => {	
        trajectory[0] = p5.mouseX;
        trajectory[1] = p5.mouseY;
    }

    p5.mouseReleased = () => {
        let ball = new Ball(trajectory[0], trajectory[1], 20);
        let vx = (p5.mouseX - trajectory[0]) * -0.1;
        let vy = (p5.mouseY - trajectory[1]) * -0.1;
        ball.setVelocity(vx, vy);
        balls.push(ball);
        trajectory[0] = 0;
        trajectory[1] = 0;
    }

    function updateBalls(p5: any, balls: Queue<Ball>) {
        for (let i = 0; i < balls.getLength(); i++) {
            let ball = balls.peek(i);
            ball.setVelocity(0, gravity);
            wallCollision(ball);
            ball.move();
            ball.display(p5);
            balls.replace(i, ball);
        }
    }

    function wallCollision(ball: Ball) {
        let pos = ball.position.peek(0);
        let prevPos = ball.position.peek(1);
        let r = ball.r;
        // collision update boolean
        let collision = false;
        if (pos[0] + r >= p5.width) {
            ball.vx *= -1 + COR;
            collision = true;
        }
        if (pos[0] - r <= 0) {
            ball.vx *= -1 + COR;
            collision = true;
        }
        if (pos[1] + r >= p5.height) {
            ball.vy *= -1 + COR;
            collision = true;
        }
        /*if (pos[1] - r <= 0) {
            ball.vy *= -1 + COR;
            collision = true;
        }*/
        // if collision, set position to previous position
        if (collision) {
            ball.position.replace(0, prevPos);
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
