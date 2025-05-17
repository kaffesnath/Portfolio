export default class Ball{
    x: number;
    y: number;
    r: number;
    vx: number;
    vy: number;

    constructor(x: number, y: number, r: number) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.vx = 0
        this.vy = 0;
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
    }

    display(p5: any) {
        p5.ellipse(this.x, this.y, this.r * 2);
    }

    setVelocity(vx: number, vy: number) {
        this.vx += vx;
        this.vy += vy;
    }
}