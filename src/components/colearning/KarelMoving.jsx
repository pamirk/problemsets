import React, {useEffect, useRef, useState} from "react";

export const Karel = () => {
    const size = {width: "700", height: "70"};
    let x = 0
    let dx = 5

    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    let revImg = "/KarelLargeRev.png"
    let forwardImg = "/KarelLarge.png"

    const draw = (frameCount) => {
        if (!context) return
        const karelImg = new Image(context.canvas.height, context.canvas.height);
        karelImg.src = dx > 0 ? forwardImg : revImg

        // clears the canvas
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        // idk what this does
        context.fillStyle = "#000000";
        // something helpful \_/
        context.beginPath();
        // Put karel at a specific x y based on frame count
        x += dx
        if (x < 0 || x > size['width'] - karelImg.width) {
            dx *= -1
            revImg = Math.random() > 0.5 ? "/KarelLargeRev.png" : "/KarelLargeFlip.png";
            forwardImg = Math.random() > 0.5 ? "/KarelLarge.png" : "/KarelLargeRevFlip.png";
        }
        context.drawImage(karelImg, x, 0, karelImg.width, karelImg.height)
        // context.arc(50, 100, 20 * Math.sin(frameCount * 0.05) ** 2, 0, 2 * Math.PI);
        context.fill();
    };
    useEffect(() => {
        //i.e. value other than null or undefined
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            setContext(ctx);
        }
    }, []);

    useEffect(() => {
        let frameCount = 0;
        let animationFrameId;

        // Check if null context has been replaced on component mount
        if (context) {
            //Our draw came here
            const render = () => {
                frameCount++;
                draw(frameCount);
                animationFrameId = window.requestAnimationFrame(render);
            };
            render();
        }
        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [draw, context]);


    return (
        <div style={{width: "100%", height: "70px", display: "flex", justifyContent: "center"}}>
            <canvas {...size} ref={canvasRef}/>
        </div>
    )
}