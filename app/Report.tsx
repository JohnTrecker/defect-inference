import { removeBorders } from "./helpers/utils"
import { Inference } from "./types"
import { Badge } from "@/components/ui/badge"

interface Props {
    output: Inference,
}

export default function Report({ output }: Props) {
    // const { predictions, time } = output
    const { predictions } = output
    const defects = predictions.filter(removeBorders)
    // const inferenceTime = Math.round(time * 1000 * 100) / 100 // Convert to ms and round to 2 decimal places

    // const report = defects.reduce((memo, prediction) => {
    //   const {class: _class, confidence} = prediction
    //   const className = _class.replace('board_', '')
    //   if (className in memo) {
    //     memo[className] += 1
    //   } else {
    //     memo[className] = 1
    //   }
    //   return memo
    // }, {})

    return (
        <div className="mb-4">
            {/* <span>
                <b>inference time</b> {` - ${inferenceTime}ms`}
            </span> */}
            {
                defects.length > 0
                ? (
                    <ul>
                        {
                            defects.map(({ class: _class, confidence }, i) => {
                                const className = _class.replace('board_', '')
                                const percentConfidence = Math.max(confidence, Math.floor(confidence * 100));
                                return (
                                    <li key={i}>
                                        <Badge className='m-4' variant="outline">
                                            {`${className} ( ${percentConfidence}% )`}
                                        </Badge>
                                    </li>
                                )
                            })
                        }
                    </ul>
                ) : (
                    <p>No defects detected.</p>
                )
            }
        </div>
    )

}