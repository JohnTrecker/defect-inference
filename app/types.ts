export interface Predictions {
    x: number,
    y: number,
    width: number,
    height: number,
    confidence: number,
    class: string,
    points: Points[],
    class_id: number
    detection_id: string,
}

interface Points {
    x: number,
    y: number,
}