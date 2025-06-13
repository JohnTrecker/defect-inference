import { WorkflowResponse, ServerResponse } from "../types"
import axios from "axios"


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
        const {crops, defects } = output

        const data: ServerResponse = {
            original: {
                width: crops.image.width,
                height: crops.image.height,
            },
            cropped: crops.predictions[0],
            defects: defects[0]?.predictions,
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
