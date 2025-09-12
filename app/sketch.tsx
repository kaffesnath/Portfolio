import { resize } from 'p5';
import Ball from './ball';
import Queue from './queue';

// importing icons from FontAwesome
import { icon } from '@fortawesome/fontawesome-svg-core' // Importing icons
import { faSquareGithub } from '@fortawesome/free-brands-svg-icons'
import { faLinkedin } from '@fortawesome/free-brands-svg-icons'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Constants for the sketch, json for information and the icons for links
const projectJsonPath = basePath + 'json/projects.json'; 
const githubIcon = icon(faSquareGithub).html[0];
const linkedinIcon = icon(faLinkedin).html[0];

// Randomised ball sizes and positions
const headerHeightScale = 10; 
//Store images globally and supply them to objects
const img: any[] = [];
const sizes: number[] = [];

//find size of window sketch is being loaded into
function findWindowSize() {
    sizes.length = 0; // reset sizes array on resize
    if (typeof window !== 'undefined') {
        const maxSize = Math.min(window.innerWidth, window.innerHeight) / 6; // Max size is 1/10th of the smaller dimension
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

function makePopup(id: number, onClose?: () => void) {
    // Create a popup for the ball with the given id
    fetch(projectJsonPath)
        .then(response => response.json())
        .then(data => {
            const project = data.projects.find((proj: any) => proj.id === id);
            if (project) {
                //determine if a popup already exists, if so do not create another
                if (document.querySelector('.popup')) return;
                if (document.querySelector('.overlay')) return;
                const overlay = document.createElement('div');
                overlay.className = 'overlay fixed inset-0 bg-white/10 animate-blur z-40';
                document.body.appendChild(overlay);

                // Create popup element
                const popup = document.createElement('div');
                popup.className = 'popup fixed top-1/2 left-1/2 transform bg-[#e9e9e9] rounded-lg shadow-lg p-6 w-11/12 h-10/12 sm:h-8/12 max-w-4xl z-50 animate-rise';
                //uses linktype to determine whether link should show, and which icon to use
                const link = project.linktype === 2 ? '' :  `<a class="text-3xl hover:text-[#2e6da8]" href="${project.link}" target="_blank" rel="noopener noreferrer">${project.linktype === 0 ? githubIcon : linkedinIcon}</a>`
                popup.innerHTML = `
                    <div class="flex justify-between items-center mb-4">` +
                        link + 
                        `<h2 class="font-lexend font-semibold text-subtitle text-[#2e6da8] text-center">${project.name}</h2>
                        <button class="close-button text-3xl text-gray-500 hover:text-[#2e6da8] cursor-pointer">&times;</button>
                    </div>
                    <div class="w-full h-1/3 mb-4 justify-center">
                        <figure class="max-w-[10rem] sm:max-w-[12rem] md:max-w-[16rem] lg:max-w-[18rem] xl:max-w-[20rem] w-full float-right ml-4 mb-4">
                            <img src="${project.image}" alt="${project.name}" class="rounded-lg mb-2 object-contain w-full h-auto"/>
                            <figcaption class="font-lexend font-regular italic text-xs md:text-sm text-center text-[#494949]">${project.imagecaption}</figcaption>
                        </figure>
                        <p class="font-lexend font-regular sm:text-[1.6vh] md:text-[1.7vh] text-[1.5vh] text-[#494949] mb-4">${project.description}</p>
                    </div>
                `;
                document.body.appendChild(popup);

                const closeButton = popup.querySelector('.close-button') as HTMLElement;
                closeButton.onclick = () => {
                    document.body.getElementsByClassName('popup')[0].classList.add('animate-fade');
                    document.body.getElementsByClassName('overlay')[0].classList.add('animate-unblur');
                    //time out to allow animation to complete before removing from DOM
                    setTimeout(() => {
                        if (document.body.contains(popup)) {
                            document.body.removeChild(overlay);
                            document.body.removeChild(popup);
                            if (onClose) onClose();
                        }
                    }, 150);
                };
            }
        })
        .catch(error => console.error('Error loading project data:', error));
}

const { width, height } = findWindowSize();

const maxBalls = 5; // Maximum number of balls in the simulation


export default function sketch(p5: any) {
    const balls = new Queue<Ball>(10);
    const friction = 0.99; // Friction coefficient to slow down balls over time
    const velScaling = 0.2; // Scaling factor for velocity
    const mScaling = 4; // Scaling factor for mass based on area
    const COR = 0.9; // Coefficient of restitution (bounciness)
    let mainCanvas: any; 
    let grid: any; // Graphics object for the grid background, is redrawn on resize on a timer
    let trajectory: number[] = [0, 0]; // Starting point of the trajectory line, stores on mouse press
    let resizeTimer: ReturnType<typeof setTimeout> | null = null; // Timer for resizing the canvas
    let interacted = -1; // Index of the ball currently being interacted with, -1 when no interaction
    let mouseControl = true; // Flag to enable/disable mouse control

    p5.preload = () => {
        //Preloads images to represent projects on ball objects.
        for(let i = 0; i < maxBalls; i++) {
            img.push(p5.loadImage('img/proj_' + (i + 1) + '.png'));
        }
        //Preload images for use in popups

    }

    p5.setup = () => {
        mainCanvas = p5.createCanvas(width, height, p5.WEBGL);  
        grid = drawBackground(p5);
        p5.frameRate(60);
        for(let i = 0; i < maxBalls; i++) {
            // make balls have defined sizes from the sizes array, but random positions
            const r = sizes[i];
            const x = p5.random(r, p5.width - r);
            const y = p5.random(r, p5.height - r);
            // Create a new ball with random size and position
            const ball = new Ball(x, y, r, img[i], i);
            ball.mouseOverSet(() => {p5.strokeWeight(4)}); // Set mouse over effect to draw vignette, fails if mouseControl is disabled
            const startVx = p5.random(-4, 4);
            const startVy = p5.random(-4, 4);
            ball.setVelocity(startVx, startVy);
            balls.push(ball);
            makePopup(5, () => {mouseControl = true;}); // Create welcome popup on load, re-enables mouse control on close
            mouseControl = false; // Disable mouse control while popup is open
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
        if (!mouseControl) return;
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
            // Create popup, using interacted balls id to retrieve json information and supplies runnable to re-enable mouse control on close
            makePopup(balls.peek(interacted).id, () => {mouseControl = true;});
            mouseControl = false; // Disable mouse control while popup is open
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
            //call find window size to reset array of sizes
            findWindowSize();
            drawBackground(p5);
            let reverse = sizes.reverse();
            for (let i = 0; i < balls.getLength(); i++) {
                const ball = balls.peek(i);
                const r = reverse[i];
                ball.recalibrate(r, width, height); // Resize ball and recalculate mass
                balls.replace(i, ball);
            }
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
            ball.display(p5, mouseControl);
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