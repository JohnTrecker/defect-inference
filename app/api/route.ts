import axios from "axios"

export async function POST(request: Request) {
    try {
        const {image} = await request.json()
        const response = await axios({
            method: "POST",
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/${process.env.NEXT_PUBLIC_MODEL_DETECT_URL}/${process.env.NEXT_PUBLIC_MODEL_VERSION}`,
            params: {
                api_key: process.env.NEXT_PUBLIC_MODEL_API_KEY,
            },
            data: image,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })


        return new Response(JSON.stringify(response.data), {
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
