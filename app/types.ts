
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

export enum Defect {
    "board_heartwood" = "board_heartwood",
    "board_whitewood" = "board_whitewood",
    "board_rot" = "board_rot",
    "board_streak" = "board_streak",
    "board_knot" = "board_knot",
    "board_wormhole" = "board_wormhole",
    "board_want" = "board_want",
    "board_bark" = "board_bark",
    "board_firescar" = "board_firescar",
    "board_beltmark" = "board_beltmark",
}