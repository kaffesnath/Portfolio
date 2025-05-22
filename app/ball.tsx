import Queue from "./queue";

export default class Ball{
    position: Queue<[number, number]>;
    r: number;
    vx: number;
    vy: number;

    constructor(x: number, y: number, r: number) {
        this.position = new Queue(2);
        // push positions twice to populate queue
        this.position.push([x, y]);
        this.position.push([x, y]);
        this.r = r;
        this.vx = 0;
        this.vy = 0;
    }

    move(gravity: number) {
        // apply gravity
        this.setVelocity(0, gravity);
        let pos = this.position.peek(0);
        this.position.push([pos[0] + this.vx, pos[1] + this.vy]);

    }

    display(p5: any) {
        let pos = this.position.peek(0);
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
        this.vx = vx;
        this.vy = vy;
    }
}