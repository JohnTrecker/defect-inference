import { Defect, Features, Inference, SavedImage, SavedImages, Point, BoundingBox, ServerResponse, DefectPrediction } from "../types";

export function removeBorders(feature: DefectPrediction) {
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
        board_heartwood: "rgb(75 92 255)",    // Bright blue
        board_whitewood: "rgb(0 180 216)",    // Cyan
        board_rot: "rgb(177 78 255)",         // Bright purple
        board_streak: "rgb(255 159 69)",      // Bright orange
        board_knot: "rgb(255 107 107)",       // Bright red
        board_flagworm: "rgb(76 153 0)",      // Dark green
        board_wormhole: "rgb(79 255 176)",    // Bright mint
        board_want: "rgb(255 97 210)",        // Bright pink
        board_bark: "rgb(255 217 61)",        // Bright yellow
        board_firescar: "rgb(255 143 163)",   // Bright salmon
        board_beltmark: "rgb(74 222 128)",    // Bright green
    };
    // const colors = {
    //     board_heartwood: "#4B5CFF",  // Bright blue
    //     board_whitewood: "#00B4D8",  // Cyan
    //     board_rot: "#B14EFF",    // Bright purple
    //     board_streak: "#FF9F45",  // Bright orange
    //     board_knot: "#FF6B6B",    // Bright red
    //     board_flagworm: "#4C9900",  // Dark green
    //     board_wormhole: "#4FFFB0", // Bright mint
    //     board_want: "#FF61D2",    // Bright pink
    //     board_bark: "#FFD93D",    // Bright yellow
    //     board_firescar: "#FF8FA3", // Bright salmon
    //     board_beltmark: "#4ADE80", // Bright green
    // };
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

            // Calculate scaling factors
            const scaleX = img.width / image.width;
            const scaleY = img.height / image.height;

            // Draw each prediction
            predictions.forEach((pred) => {
                const color = getColorForLabel(pred.class as Defect);

                if ('points' in pred && pred.points && pred.points.length > 0) {
                    drawPolygon(ctx, pred.points, color, scaleX, scaleY);
                } else if ('x' in pred && 'width' in pred) {
                    drawBoundingBox(ctx, pred as BoundingBox, color, scaleX, scaleY);
                }
            });

            // console.log(`Successfully drew ${masksDrawn}/${predictions.length} masks`);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.src = imageUrl;
    });
};

function drawPolygon(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    scaleX: number,
    scaleY: number
) {
    const scaledPoints = points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY
    }));

    // Set fill style with transparency
    const rgbMatch = color.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\)/);
    const fillColor = rgbMatch
        ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.1)`
        : color;
    ctx.fillStyle = fillColor;

    // Draw polygon
    ctx.beginPath();
    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
    scaledPoints.forEach((point: Point) => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawBoundingBox(
    ctx: CanvasRenderingContext2D,
    box: BoundingBox,
    color: string,
    scaleX: number,
    scaleY: number
) {
    const scaledBox = {
        x: (box.x - box.width / 2) * scaleX,
        y: (box.y - box.height / 2) * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY
    };

    // Set fill style with transparency
    const rgbMatch = color.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\)/);
    const fillColor = rgbMatch
        ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.4)`
        : color;
    ctx.fillStyle = fillColor;

    // Draw rectangle
    ctx.fillRect(scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height);

    // Draw outline
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height);
}

export function getUniqueImages(images: SavedImages): SavedImages {
    const map: Record<string, SavedImage > = {}
    for (const img of images) {
        if (!(img.file in map)) {
            map[img.file] = img
        }
    }
    return Object.values(map);
}

export function cropImage(base64Image: string, response: ServerResponse): Promise<string> {
    return new Promise((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
            // Create canvas for cropping
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(base64Image); // Fallback if context can't be created

            // Get crop dimensions from ServerResponse
            const { cropped } = response;
            const { x, y, width, height } = cropped;

            // Calculate scaling factors
            const scaleX = img.width / response.original.width;
            const scaleY = img.height / response.original.height;

            // Calculate cropped coordinates adjusted for scale
            const scaledX = (x - width / 2) * scaleX;
            const scaledY = (y - height / 2) * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            // Set canvas dimensions to cropped size
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;

            // Draw the cropped portion of the image
            ctx.drawImage(
                img,
                scaledX, scaledY, scaledWidth, scaledHeight, // Source coordinates
                0, 0, scaledWidth, scaledHeight // Destination coordinates
            );

            // Return the cropped image as base64
            resolve(canvas.toDataURL('image/jpeg'));
        };

        // Handle image loading errors
        img.onerror = () => resolve(base64Image);

        // Set image source
        img.src = base64Image;
    });
}