import { Defect, Features, Inference, Prediction } from "../types";

export function removeBorders(feature: Prediction) {
    return !['board_heartwood', 'board_whitewood'].includes(feature.class)
}

export function getEnabledClasses(features: Features): string[] {
    return Object.entries(features)
        .filter((keyValuePair) => keyValuePair[1])
        .map(([className]) => className)
};

export function getColorForLabel(label: Defect) {
    // Define colors for each label type
    const colors = {
        board_heartwood: "#4B5CFF",  // Bright blue
        board_whitewood: "#00B4D8",  // Cyan
        board_rot: "#B14EFF",    // Bright purple
        board_streak: "#FF9F45",  // Bright orange
        board_knot: "#FF6B6B",    // Bright red
        board_wormhole: "#4FFFB0", // Bright mint
        board_want: "#FF61D2",    // Bright pink
        board_bark: "#FFD93D",    // Bright yellow
        board_firescar: "#FF8FA3", // Bright salmon
        board_beltmark: "#4ADE80", // Bright green
    };
    return colors[label] || '#000000';
}

// Add function to draw masks on canvas
export async function drawMasksOnImage(imageUrl: string, imageData: Inference) {
    const { predictions, image } = imageData

    return new Promise<string>((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Draw each prediction
            predictions.forEach((pred) => {
                if (!pred.points || pred.points.length === 0) {
                    return;
                }

                // Calculate scaling factors
                const scaleX = img.width / image.width;
                const scaleY = img.height / image.height;

                // ctx.strokeStyle = getColorForLabel(pred.class as Defect);
                // ctx.lineWidth = parseInt(formData.stroke);
                const color = getColorForLabel(pred.class as Defect);
                ctx.fillStyle = color + '66'; // Add 66 for 40% opacity in hex

                // Draw polygon
                ctx.beginPath();
                const scaledPoints = pred.points.map(point => ({
                    x: point.x * scaleX,
                    y: point.y * scaleY
                }));

                ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
                scaledPoints.forEach((point: { x: number, y: number }) => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.closePath();
                ctx.fill();
                // ctx.stroke();

                // Draw outline
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.stroke();
            });

            // console.log(`Successfully drew ${masksDrawn}/${predictions.length} masks`);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.src = imageUrl;
    });
};