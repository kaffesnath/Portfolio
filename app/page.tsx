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
    const gravity = 0.1;
    const COR = 0.9; // Coefficient of restitution (bounciness)
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
        let vx = (p5.mouseX - trajectory[0]) * -gravity / 2;
        let vy = (p5.mouseY - trajectory[1]) * -gravity / 2;
        ball.setVelocity(vx, vy);
        balls.push(ball);
        trajectory[0] = 0;
        trajectory[1] = 0;
    }

    function updateBalls(p5: any, balls: Queue<Ball>) {
        for (let i = 0; i < balls.getLength(); i++) {
            let ball = balls.peek(i);
            for (let j = i + 1; j < balls.getLength(); j++) {
                let other = balls.peek(j);
                ballCollision(ball, other);
            }
            wallCollision(ball);
            ball.move(gravity);
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
            ball.vx *= -COR;
            collision = true;
        }
        if (pos[0] - r <= 0) {
            ball.vx *= -COR;
            collision = true;
        }
        if (pos[1] + r >= p5.height) {
            ball.vy *= -COR;
            collision = true;
        }
        /*if (pos[1] - r <= 0) {
            ball.vy *= COR;
            collision = true;
        }*/
        // if collision, set position to previous position
        if (collision) {
            ball.position.replace(0, prevPos);
        }
    }

    /**
     * This method handles the collision between two balls. This uses the concept of elastic Collision
     * to calculate the new velocities of the balls after collision. While also handling overlap 
     * of the balls on collision.
     * @param ball 
     * @param other 
     */
    function ballCollision(ball: Ball, other: Ball) {
        let pos1 = ball.position.peek(0);
        let pos2 = other.position.peek(0);
        //initial mass is 1 each, will be stored in balls
        let m1 = 1
        let m2 = 1;
        // positions for balls
        let x1 = p5.createVector(pos1[0], pos1[1]);
        let x2 = p5.createVector(pos2[0], pos2[1]);
        // velocity of balls
        let v1 = p5.createVector(ball.vx, ball.vy);
        let v2 = p5.createVector(other.vx, other.vy);
        //calculate distance between balls
        let distance = p5.dist(x1.x, x1.y, x2.x, x2.y);
        let minDistance = ball.r + other.r;

        if (distance < minDistance) {
            //first handle overlapping
            let overlap = minDistance - distance;
            let correction = x1.copy().sub(x2).normalize().mult(overlap / 2);
            x1.add(correction);
            x2.sub(correction);
            // update positions
            ball.position.replace(0, [x1.x, x1.y]);
            other.position.replace(0, [x2.x, x2.y]);
            // calculate velocities, dotProduct and magnitude for both balls
            let x1Minusx2 = x1.copy().sub(x2);
            let x2Minusx1 = x2.copy().sub(x1);
            let v1Minusv2 = v1.copy().sub(v2);
            let v2Minusv1 = v2.copy().sub(v1);

            // calculate dot products and magnitudes
            let dot1 = v1Minusv2.dot(x1Minusx2);
            let magSq1 = x1Minusx2.magSq();
            let dot2 = v2Minusv1.dot(x2Minusx1);
            let magSq2 = x2Minusx1.magSq();

            // new velocities after elastic collision
            let v1f = v1.copy().sub(x1Minusx2.copy().mult((2 * m2 / (m1 + m2)) * (dot1 / magSq1)));
            let v2f = v2.copy().sub(x2Minusx1.copy().mult((2 * m1 / (m1 + m2)) * (dot2 / magSq2)));

            // update velocities
            ball.updateVelocity(v1f.x, v1f.y);
            other.updateVelocity(v2f.x, v2f.y);
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
