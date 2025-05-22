import { Prediction, Defect } from "../types"
import axios from "axios"

interface RawPrediction extends Omit<Prediction, "class"> {
    class: Prediction["class"] | "board_rot_or_firescar"
}

const convertToDefect = (prediction: RawPrediction) => {
    if (prediction.class === 'board_rot_or_firescar') {
        return {
            ...prediction,
            class: Defect.board_rot,
        }
    }
    return prediction
}
export async function POST(request: Request) {
    try {
        const {image} = await request.json()
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${process.env.NEXT_PUBLIC_MODEL_DETECT_URL}/${process.env.NEXT_PUBLIC_MODEL_VERSION}`
        const response = await axios({
            method: "POST",
            url,
            data: JSON.stringify({
                api_key: process.env.NEXT_PUBLIC_MODEL_API_KEY,
                inputs: {
                    "image": { "type": "url", "value": image }
                }
            }),
            headers: {
                'Content-Type': 'application/json'
            }
            // Single Model API (deprecated)
            //     params: { api_key: process.env.NEXT_PUBLIC_MODEL_API_KEY },
            //     data: image,
            //     headers: {  "Content-Type": "application/x-www-form-urlencoded" }
        })

        const output = response.data?.outputs[0]?.output
        const predictions: Prediction[] = output?.predictions?.predictions.map(convertToDefect) ?? output?.predictions?.predictions

        const data = JSON.stringify({
            inference_id: output?.inference_id,
            time: undefined,
            image: output?.predictions?.image ?? { width: 0, height: 0 },
            predictions,
        })
        return new Response(data, {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        )
    }

}
