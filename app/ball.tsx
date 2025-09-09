import Queue from "./queue";

export default class Ball{
    position: Queue<[number, number]>;
    r: number;
    m: number; 
    vx: number;
    vy: number;
    mouseOver: Function | null = null;
    interaction: boolean = false; // flag for interaction state
    img: p5.Image;
    id: number;

    constructor(x: number, y: number, r: number, img: p5.Image, id: number) {
        this.position = new Queue(2);
        this.id = id;

        // push positions twice to populate queue
        this.position.push([x, y]);
        this.position.push([x, y]);
        this.r = r;
        this.vx = 0;
        this.vy = 0;
        this.m = Math.floor(Math.PI * r * r / 1000); // mass is calculated based on area, divided by 1000 for scaling
        this.img = img;
    }

    move(friction: number) {
        const pos = this.position.peek(0);
        // apply friction
        this.vx *= friction;
        this.vy *= friction;
        this.position.push([pos[0] + this.vx, pos[1] + this.vy]);

    }

    mouseOverSet(func: Function) {
        //creates a callback for mouseOver events
        this.mouseOver = func;
    }
        

    display(p5: any) {
        const pos = this.position.peek(0);
        // if mouse is over the ball, call the mouseOver function
        if (this.mouseOver && p5.dist(p5.mouseX, p5.mouseY, pos[0], pos[1]) < this.r || this.interaction) {
            this.mouseOver();
        } else {
            p5.strokeWeight(2);
        }
        p5.texture(this.img);
        p5.ellipse(pos[0], pos[1], this.r * 2);
    }

    setVelocity(vx: number, vy: number) {
        if (Math.abs(vx) < 0.1) {
            vx = 0;
        }
        if (Math.abs(vy) < 0.1) {
            vy = 0;
        }
        this.vx += vx;
        this.vy += vy;
    }

    updateVelocity(vx: number, vy: number) {
        if(this.interaction) {
            return;
        }
        this.vx = vx;
        this.vy = vy;
    }
}