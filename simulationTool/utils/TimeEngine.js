/**
 * TimeEngine - Centralized time control system for agent visualization
 * Manages playback, interpolation timing, and synchronization across all UI components
 */

export default class TimeEngine {
    constructor(store) {
        this.store = store;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.accumulatedTime = 0;
        this.isPlaying = false;
        this.speed = 1.0; // 1x normal speed
        this.loop = false;
        
        // Performance monitoring
        this.frameCount = 0;
        this.fpsStartTime = 0;
        this.currentFPS = 0;
    }

    /**
     * Start the time engine animation loop
     */
    play() {
        if (this.isPlaying) {
            return;
        }
        
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.fpsStartTime = this.lastFrameTime;
        this.frameCount = 0;
        
        this.store.dispatch("agentVisualization/setPlaying", true);
        this.tick();
    }

    /**
     * Pause the animation
     */
    pause() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.store.dispatch("agentVisualization/setPlaying", false);
    }

    /**
     * Reset to start
     */
    reset() {
        this.pause();
        this.accumulatedTime = 0;
        this.store.dispatch("agentVisualization/setCurrentTime", 0);
    }

    /**
     * Set playback speed
     * @param {number} speed - Multiplier (0.1x to 10x)
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(10, speed));
        this.store.dispatch("agentVisualization/setSpeed", this.speed);
    }

    /**
     * Jump to specific time
     * @param {number} time - Timestamp to jump to
     */
    jumpToTime(time) {
        const timeSteps = this.store.state.agentVisualization.timeSteps;
        if (!timeSteps || timeSteps.length === 0) {
            return;
        }

        // Clamp time to valid range
        const minTime = timeSteps[0];
        const maxTime = timeSteps[timeSteps.length - 1];
        const clampedTime = Math.max(minTime, Math.min(maxTime, time));
        
        this.accumulatedTime = clampedTime - timeSteps[0];
        this.store.dispatch("agentVisualization/setCurrentTime", clampedTime);
    }

    /**
     * Skip to next timestep
     */
    skipForward() {
        const timeSteps = this.store.state.agentVisualization.timeSteps;
        const currentTime = this.store.state.agentVisualization.currentTime;
        
        if (!timeSteps || timeSteps.length === 0) {
            return;
        }

        const currentIndex = timeSteps.findIndex(t => t === currentTime);
        if (currentIndex >= 0 && currentIndex < timeSteps.length - 1) {
            this.jumpToTime(timeSteps[currentIndex + 1]);
        }
    }

    /**
     * Skip to previous timestep
     */
    skipBackward() {
        const timeSteps = this.store.state.agentVisualization.timeSteps;
        const currentTime = this.store.state.agentVisualization.currentTime;
        
        if (!timeSteps || timeSteps.length === 0) {
            return;
        }

        const currentIndex = timeSteps.findIndex(t => t === currentTime);
        if (currentIndex > 0) {
            this.jumpToTime(timeSteps[currentIndex - 1]);
        }
    }

    /**
     * Main animation loop
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    tick(timestamp = performance.now()) {
        if (!this.isPlaying) {
            return;
        }

        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Update accumulated time with speed multiplier
        this.accumulatedTime += deltaTime * this.speed;

        // Get time range
        const timeSteps = this.store.state.agentVisualization.timeSteps;
        if (!timeSteps || timeSteps.length === 0) {
            this.pause();
            return;
        }

        const startTime = timeSteps[0];
        const endTime = timeSteps[timeSteps.length - 1];
        const totalDuration = endTime - startTime;

        // Calculate current time
        let currentTime = startTime + this.accumulatedTime;

        // Handle end of animation
        if (currentTime >= endTime) {
            if (this.loop) {
                this.accumulatedTime = 0;
                currentTime = startTime;
            } else {
                currentTime = endTime;
                this.pause();
            }
        }

        // Update store
        this.store.dispatch("agentVisualization/setCurrentTime", currentTime);

        // Calculate FPS
        this.frameCount++;
        const fpsElapsed = timestamp - this.fpsStartTime;
        if (fpsElapsed >= 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / fpsElapsed);
            this.store.dispatch("agentVisualization/setFPS", this.currentFPS);
            this.frameCount = 0;
            this.fpsStartTime = timestamp;
        }

        // Continue animation
        this.animationFrameId = requestAnimationFrame((ts) => this.tick(ts));
    }

    /**
     * Set loop mode
     * @param {boolean} enabled - Whether to loop playback
     */
    setLoop(enabled) {
        this.loop = enabled;
    }

    /**
     * Get current FPS
     * @returns {number} Current frames per second
     */
    getFPS() {
        return this.currentFPS;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.pause();
    }
}
