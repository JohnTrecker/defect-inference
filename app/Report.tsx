import { removeBorders } from "./helpers/utils"
import { Inference } from "./types"

interface Props {
    output: Inference,
}

export default function Report({ output }: Props) {
    const { predictions, time } = output
    const defects = predictions.filter(removeBorders)
    const inferenceTime = Math.round(time * 1000 * 100) / 100 // Convert to ms and round to 2 decimal places

    if (defects.length === 0) return <p>No defects detected.</p>

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
            {/* <label className="input__label">Detected Defects</label> */}
            <span>
                <b>inference time</b> {` - ${inferenceTime}ms`}
            </span>
            <ul>
                {
                    defects.map(({ class: _class, confidence }, i) => {
                        const className = _class.replace('board_', '')
                        const percentConfidence = Math.max(confidence, Math.floor(confidence * 100));
                        return (
                            <li key={i}>
                                <span>
                                    <b>{className}</b> {` - ${percentConfidence}% confidence`}
                                </span>
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )

}