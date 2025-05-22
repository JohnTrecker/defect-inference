import { useEffect, useState } from "react";
import { Features, Inference } from "./types";
import { drawMasksOnImage, getEnabledClasses } from "./helpers/utils";
import Image from 'next/image';

interface Props {
    image: string,
    data: Inference,
    features: Features,
}

export default function WoodImage({image, data, features}: Props){
    const [processedImage, setProcessedImage] = useState<string>(image);
    const enabledClasses = getEnabledClasses(features)

    const processImageWithMasks = async (imageData: string, inferenceData: Inference, classes: string[]) => {
        const filteredData = {
            ...inferenceData,
            predictions: inferenceData.predictions?.filter(pred =>
                classes.includes(pred.class)
            ) ?? inferenceData.predictions
        };

        try {
            const newImageUrl = await drawMasksOnImage(imageData, filteredData);
            setProcessedImage(newImageUrl);
        } catch (error) {
            console.error('Error drawing defect masks:', error);
        }
    };

    useEffect(() => {
        if (data && enabledClasses.length) {
            processImageWithMasks(image, data, enabledClasses);
        }
    }, [data, enabledClasses, image])

    return processedImage ? (
        <div className="flex-1 relative">
            <Image
                src={processedImage}
                alt="Output preview"
                width={data.image?.width ?? 1024}
                height={data.image?.height ?? 322}
                style={{ width: '100%', height: 'auto' }}
            />
        </div>
    ) : null
}