import { getColorForLabel, removeBorders } from "./helpers/utils"
import { Inference } from "./types"
import { Badge } from "@/components/ui/badge"

interface Props {
    output: Inference,
}

export default function Report({ output }: Props) {
    const { predictions } = output
    const defects = predictions?.filter(removeBorders) ?? predictions
    // const inferenceTime = Math.round(time * 1000 * 100) / 100 // Convert to ms and round to 2 decimal places

    return (
        <div className="mb-4">
            {/* <span>
                <b>inference time</b> {` - ${inferenceTime}ms`}
            </span> */}
            {
                defects.length > 0
                ? (
                    <ul className="flex">
                        {
                            predictions.map(({ class: _class, confidence }, i) => {
                                const classLabel = _class.replace('board_', '')
                                const percentConfidence = Math.max(confidence, Math.floor(confidence * 100));
                                // const colorClass = `bg-board-${classLabel}`
                                const color = getColorForLabel(_class)
                                return (
                                    <li key={i}>
                                        <Badge className='m-4' variant="outline" style={{ backgroundColor: color, opacity: 0.8 }}>
                                            {`${classLabel} - ${percentConfidence}%`}
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
