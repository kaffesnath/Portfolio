import { resize } from 'p5';
import Ball from './ball';
import Queue from './queue';

// Randomised ball sizes and positions
const headerHeightScale = 10; 
//Store images globally and supply them to objects
const img: any[] = [];
const sizes: number[] = [];

//find size of window sketch is being loaded into
function findWindowSize() {
    if (typeof window !== 'undefined') {
        const maxSize = Math.min(window.innerWidth, window.innerHeight) / 7.5; // Max size is 1/10th of the smaller dimension
        const minSize = maxSize / 2; // Minimum size is 1/2 of the max size
        for(let i = 0; i < 5; i++) {
            // input 5 evenly spaced ball sizes into the array
            sizes.push(Math.floor(minSize + (i * (maxSize - minSize) / 4))); // 5 sizes from min to max
        }
        return {
            width: window.innerWidth,
            height: window.innerHeight - (window.innerHeight / headerHeightScale),
        };
    }
    return {width: 800, height: 600}; // Default size for SSR
}

function makePopup(id: number) {
    // Create a popup for the ball with the given id
    console.log(`Creating popup for ball ${id}`);
    const popup = document.createElement('div');
    popup.id = `popup-${id}`;
    popup.className = "absolute top-[10%] left-[10%] w-[20%] h-[20%] bg-white border border-gray-400 shadow-md text-black z-50";
    popup.innerHTML = `<h2>Ball ${id}</h2><p>This is a popup for ball ${id}.</p>`;
    document.getElementById('mainBody')?.appendChild(popup);
}

const { width, height } = findWindowSize();


export default function sketch(p5: any) {
    const balls = new Queue<Ball>(10);
    const friction = 0.99;
    const velScaling = 0.2; // Scaling factor for velocity
    const mScaling = 5; // Scaling factor for mass based on area
    const COR = 0.9; // Coefficient of restitution (bounciness)
    let mainCanvas: any; // Main canvas for the sketch
    let grid: any; // Graphics object for the grid background
    let trajectory: number[] = [0, 0];
    let resizeTimer: ReturnType<typeof setTimeout> | null = null; // Timer for resizing the canvas
    let interacted = -1;

    p5.preload = () => {
        //Preloads images of projects for use in order of magnitude chosen, further development would see the size of the balls be dictated by project size
        img.push(p5.loadImage('/img/proj_1.png'))
        img.push(p5.loadImage('/img/proj_5.png'))
        img.push(p5.loadImage('/img/proj_4.png'))
        img.push(p5.loadImage('/img/proj_2.png'))
        img.push(p5.loadImage('/img/proj_3.png'))
    }

    p5.setup = () => {
        mainCanvas = p5.createCanvas(width, height, p5.WEBGL);  
        grid = drawBackground(p5);
        p5.frameRate(60);
        for(let i = 0; i < 5; i++) {
            // Randomize ball size and position
            const r = sizes[i];
            const x = p5.random(r, p5.width - r);
            const y = p5.random(r, p5.height - r);
            // Create a new ball with random size and position
            const ball = new Ball(x, y, r, img[i]);
            ball.mouseOverSet(() => {p5.strokeWeight(4)}); // Set mouse over effect to draw vignette
            balls.push(ball);
        }
    };

    p5.draw = () => {
        // Update and display all balls
        p5.background("#ffffff");
        p5.image(grid, -p5.width / 2, -p5.height / 2);
        p5.push();
        p5.translate(-p5.width / 2, -p5.height / 2);
        
        updateBalls(p5, balls);
        // Draw trajectory line if a ball is currently interacted with
        drawTrajectory(p5);
        p5.pop();

        const gl = (p5 as any)._renderer.GL;
        gl.disable(gl.DEPTH_TEST); // force renderer to ignore z-buffer
    };

    p5.mousePressed = p5.touchStarted = () => {
        for(let i = 0; i < balls.getLength(); i++) {
            const ball = balls.peek(i);
            const pos = ball.position.peek(0);
            const d = p5.dist(p5.mouseX, p5.mouseY, pos[0], pos[1]);
            if (d < ball.r) {
                ball.updateVelocity(0, 0);
                trajectory = [pos[0], pos[1]];
                interacted = i; 
                ball.interaction = true; 
            }
        }
    }

    p5.mouseReleased = p5.touchEnded = () => {
        if (interacted == -1) return;
        if (p5.dist(p5.mouseX, p5.mouseY, trajectory[0], trajectory[1]) < balls.peek(interacted).r) {
            // If mouse is released close to the trajectory point, treat as click and open pop-up
            balls.peek(interacted).interaction = false;
            makePopup(interacted);
            interacted = -1; // Reset interacted index
            return;
        }
        const ball = balls.peek(interacted);
        //calculates velocity based on drag direction and size of ball for scaling with a 1/5 scaling for velocity overall
        const vx = (p5.mouseX - trajectory[0]) * (velScaling / ball.m * mScaling);
        const vy = (p5.mouseY - trajectory[1]) * (velScaling / ball.m * mScaling);
        //reset ball to be uninteracted for next interaction. Also removes velocity restriction for update.
        balls.peek(interacted).interaction = false;
        interacted = -1;
        ball.updateVelocity(vx, vy);
    }

    p5.windowResized = () => {
        const { width, height } = findWindowSize();
        p5.resizeCanvas(width, height);
        if (resizeTimer) {
            clearTimeout(resizeTimer);
        }

        resizeTimer = setTimeout(() => {
            drawBackground(p5);
            resizeTimer = null;
        }, 200); // Delay to allow for resizing
    };

    function updateBalls(p5: any, balls: Queue<Ball>) {
        for (let i = 0; i < balls.getLength(); i++) {
            const ball = balls.peek(i);

            for (let j = i + 1; j < balls.getLength(); j++) {
                const other = balls.peek(j);
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
            const ball = balls.peek(interacted);
            const pos = ball.position.peek(0);
            p5.strokeWeight(2);
            p5.line(pos[0], pos[1], p5.mouseX, p5.mouseY);
        }
    }

    function drawBackground(p5: any) {
        if (grid) {
            grid.remove(); // Remove the old grid if it exists
        }
        // Draw a grid background
        grid = p5.createGraphics(p5.width, p5.height, p5.P2D);

        grid.stroke("#f3f3f3");
        grid.strokeWeight(2);
        for (let i = 0; i < p5.width; i += 50) {
            grid.line(i, 0, i, p5.height);
        }
        for (let j = 0; j < p5.height; j += 50) {
            grid.line(0, j, p5.width, j);
        }

        return grid;
    }

    function wallCollision(ball: Ball) {
        const pos = ball.position.peek(0);
        const r = ball.r;
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
        if (collision) {
            if (ball.vx > 0.1 || ball.vy > 0.1) {
                // replace the current position with the previous position
                ball.position.replace(0, ball.position.peek(1));
                return;
            }
            // if velocity is zero, ensure ball is clamped inside the canvas
            const x = p5.constrain(pos[0], ball.r, p5.width - ball.r);
            const y = p5.constrain(pos[1], ball.r, p5.height - ball.r);
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
        const pos1 = ball.position.peek(0);
        const pos2 = other.position.peek(0);
        //mass is calculated in balls based on area
        const m1 = ball.m;
        const m2 = other.m;
        // positions for balls
        const x1 = p5.createVector(pos1[0], pos1[1]);
        const x2 = p5.createVector(pos2[0], pos2[1]);
        // velocity of balls
        const v1 = p5.createVector(ball.vx, ball.vy);
        const v2 = p5.createVector(other.vx, other.vy);
        const distance = p5.dist(x1.x, x1.y, x2.x, x2.y);
        const minDistance = ball.r + other.r;

        if (distance < minDistance) {
            //first handle overlapping
            const overlap = minDistance - distance;
            const correction = x1.copy().sub(x2).normalize().mult(overlap / 2);
            x1.add(correction);
            x2.sub(correction);
            // update positions
            ball.position.replace(0, [x1.x, x1.y]);
            other.position.replace(0, [x2.x, x2.y]);

            const x1Minusx2 = x1.copy().sub(x2);
            const x2Minusx1 = x2.copy().sub(x1);
            const v1Minusv2 = v1.copy().sub(v2);
            const v2Minusv1 = v2.copy().sub(v1);

            // calculate dot products and magnitudes
            const dot1 = v1Minusv2.dot(x1Minusx2);
            const magSq1 = x1Minusx2.magSq();
            const dot2 = v2Minusv1.dot(x2Minusx1);
            const magSq2 = x2Minusx1.magSq();

            // new velocities after elastic collision
            const v1f = v1.copy().sub(x1Minusx2.copy().mult((2 * m2 / (m1 + m2)) * (dot1 / magSq1)));
            const v2f = v2.copy().sub(x2Minusx1.copy().mult((2 * m1 / (m1 + m2)) * (dot2 / magSq2)));

            ball.updateVelocity(v1f.x, v1f.y);
            other.updateVelocity(v2f.x, v2f.y);
        }
    }
};