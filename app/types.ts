
export interface Inference {
    inference_id: string,
    time?: number,
    image: Dimensions,
    predictions: Prediction[],
}
export interface Prediction {
    x: number,
    y: number,
    width: number,
    height: number,
    confidence: number,
    class: Defect,
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

export interface Point {
    x: number;
    y: number;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    class: string;
    confidence: number;
    detection_id: string;
    class_id: number;
}

export enum Defect {
    "board_heartwood" = "board_heartwood",
    "board_whitewood" = "board_whitewood",
    "board_rot" = "board_rot",
    "board_streak" = "board_streak",
    "board_knot" = "board_knot",
    "board_wormhole" = "board_wormhole",
    "board_flagworm" = "board_flagworm",
    "board_want" = "board_want",
    "board_bark" = "board_bark",
    "board_firescar" = "board_firescar",
    "board_beltmark" = "board_beltmark",
}

export type Features = {
    [key in Defect]: boolean
}

export interface SavedImage {
    image: string,
    data: Inference,
    file: string,
}

export type SavedImages = SavedImage[]