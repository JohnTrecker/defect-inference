import { DefectPrediction, Defect, WorkflowResponse, ServerResponse } from "../types"
import axios from "axios"

interface RawPrediction extends Omit<DefectPrediction, "class"> {
    class: DefectPrediction["class"] | "board_rot_or_firescar"
}

const convertToDefect = (prediction: RawPrediction): DefectPrediction => {
    if (prediction.class === 'board_rot_or_firescar') {
        return {
            ...prediction,
            class: Defect.board_rot,
        }
    }
    return prediction as DefectPrediction
}
export async function POST(request: Request) {
    try {
        const {image} = await request.json()
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${process.env.NEXT_PUBLIC_MODEL_DETECT_URL}/${process.env.NEXT_PUBLIC_MODEL_VERSION}`
        // track timing of the request
        const startTime = Date.now()
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
        const endTime = Date.now()
        const time = endTime - startTime

        const output: WorkflowResponse = response.data?.outputs[0]
        const {crops, defects} = output

        const data: ServerResponse = {
            original: {
                width: crops.predictions.image.width,
                height: crops.predictions.image.height,
            },
            cropped: crops.predictions.predictions.reduce((largest, current) => {
                const largestArea = largest.width * largest.height;
                const currentArea = current.width * current.height;
                return currentArea > largestArea ? current : largest;
            }, crops.predictions.predictions[0]),
            defects: defects[0]?.predictions.predictions.map(convertToDefect) ?? [],
            cropModelId: crops.model_id,
            defectModelId: defects[0]?.model_id ?? '',
            inferenceId: defects[0]?.inference_id ?? '',
            time,
        }

        return new Response(JSON.stringify(data), {
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
