import { update } from 'p5';
import Ball from './ball';
import Queue from './queue';

// Randomised ball sizes and positions
const sizes = [50, 60, 70]
//Store images globally and supply them to objects
let temp: any;

//find size of window sketch is being loaded into
function findWindowSize() {
    if (typeof window !== 'undefined') {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }
    return {width: 800, height: 600}; // Default size for SSR
}

const { width, height } = findWindowSize();


export default function sketch(p5: any) {
    const balls = new Queue<Ball>(10);
    const friction = 0.99;
    const COR = 0.9; // Coefficient of restitution (bounciness)
    let trajectory: number[] = [0, 0];
    let interacted = -1;

    p5.preload = () => {
        //Preloads images of projects for use within the balls
        temp = p5.loadImage('/img/logo.png')
    }

    p5.setup = () => {
        p5.createCanvas(width, height, p5.WEBGL);
        
        p5.frameRate(60);
        for(let i = 0; i < 5; i++) {
            // Randomize ball size and position
            let r = sizes[Math.floor(Math.random() * sizes.length)];
            let x = p5.random(r, p5.width - r);
            let y = p5.random(r, p5.height - r);
            // Create a new ball with random size and position
            let ball = new Ball(x, y, r, temp);
            ball.mouseOverSet(() => {p5.strokeWeight(8);})
            balls.push(ball);
        }
    };

    p5.draw = () => {
        // Update and display all balls
        p5.background(240);
        p5.push();
        p5.translate(-p5.width / 2, -p5.height / 2);
        updateBalls(p5, balls);
        // Draw trajectory line if a ball is interacted with
        drawTrajectory(p5);
        p5.pop();
    };

    p5.mousePressed = p5.touchStarted = () => {
        for(let i = 0; i < balls.getLength(); i++) {
            let ball = balls.peek(i);
            // Check if the mouse is within the bounds of the ball
            let pos = ball.position.peek(0);
            let d = p5.dist(p5.mouseX, p5.mouseY, pos[0], pos[1]);
            if (d < ball.r) {
                // If the mouse is pressed on a ball, set its velocity to zero and store the trajectory
                ball.updateVelocity(0, 0);
                trajectory = [pos[0], pos[1]];
                interacted = i; // Store the index of the interacted ball to hold stroke weight
                ball.interaction = true; // Set interaction flag to true
            }
        }
    }

    p5.mouseReleased = p5.touchEnded = () => {
        if (interacted == -1) return; // If no ball was interacted with, do nothing
        if (p5.dist(p5.mouseX, p5.mouseY, trajectory[0], trajectory[1]) < balls.peek(interacted).r) {
            // If mouse is released close to the trajectory point, do nothing
            balls.peek(interacted).interaction = false;
            interacted = -1; // Reset interacted index
            return;
        }
        //calculate trajectory vector from the trajectory point to the mouse position
        let ball = balls.peek(interacted);
        //calculates velocity based on drag direction and size of ball for scaling with a 1/5 scaling for velocity overall
        let vx = (p5.mouseX - trajectory[0]) * (0.2 / ball.m * 2);
        let vy = (p5.mouseY - trajectory[1]) * (0.2 / ball.m * 2);
        //reset ball to be uninteracted for next interaction. Also removes velocity restriction for update.
        balls.peek(interacted).interaction = false;
        interacted = -1;
        ball.updateVelocity(vx, vy);
    }

    p5.windowResized = () => {
        const { width, height } = findWindowSize();
        p5.resizeCanvas(width, height);
    };
        
    function updateBalls(p5: any, balls: Queue<Ball>) {
        for (let i = 0; i < balls.getLength(); i++) {
            let ball = balls.peek(i);

            // Check for collisions with other balls and walls
            for (let j = i + 1; j < balls.getLength(); j++) {
                let other = balls.peek(j);
                ballCollision(ball, other);
            }
            wallCollision(ball);
            ball.move(friction);
            ball.display(p5);
            balls.replace(i, ball);
        }
    }

    function drawTrajectory(p5: any) {
        // Draw trajectory line from the last interacted ball to the mouse position
        if (interacted != -1) {
            let ball = balls.peek(interacted);
            let pos = ball.position.peek(0);
            p5.strokeWeight(2);
            p5.line(pos[0], pos[1], p5.mouseX, p5.mouseY);
        }
    }

    function wallCollision(ball: Ball) {
        let pos = ball.position.peek(0);
        let r = ball.r;
        // collision update boolean
        let collision = false;

        //each wall reverses its respective velocity, and sets the flag for returning to previous position
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
        if (pos[1] - r <= 0) {
            ball.vy *= -COR;
            collision = true;
        }
        // if collision, set position to previous position
        if (collision) {
            if (ball.vx > 0.1 || ball.vy > 0.1) {
                // replace the current position with the previous position
                ball.position.replace(0, ball.position.peek(1));
                return;
            }
            // if velocity is zero, ensure ball is clamped inside the canvas
            let x = p5.constrain(pos[0], ball.r, p5.width - ball.r);
            let y = p5.constrain(pos[1], ball.r, p5.height - ball.r);
            ball.position.replace(0, [x, y]);
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
        //mass is calculated in balls based on area
        let m1 = ball.m;
        let m2 = other.m;
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