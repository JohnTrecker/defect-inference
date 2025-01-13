
export interface Inference {
    inference_id: string,
    time: number,
    image: Dimensions,
    predictions: Predictions[],
}
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

interface Dimensions {
    width: number,
    height: number,
}

interface Points {
    x: number,
    y: number,
}