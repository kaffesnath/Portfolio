/*This file implements a queue class to hold a certain amount of tuples.
This is for storage of positional data for the balls. 
By storing tuples of (x, y) coordinates, accessing the last position of the ball for collision handling is easier and automatically handled within the data structure */

export default class Queue<T> {
    private items: T[];
    private size: number;

    constructor(size: number) {
        this.items = [];
        this.size = size;
    }

    push(item: T) {
        this.items.unshift(item); // Add the new item to the front
        if (this.items.length > this.size) {
            this.items.pop(); // Remove the oldest item
        }
    }

    peek(x: number): T {
        return this.items[x];
    }

    replace(index: number, item: T) {
        if (index >= 0 && index < this.items.length) {
            this.items[index] = item;
        }
    }
}